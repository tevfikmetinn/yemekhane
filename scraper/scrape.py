"""Fırat Üni. Üniversite Evi ana sayfasından günlük menüyü çeker.

Strateji:
  1. https://unievi.firat.edu.tr/ HTML'i indirilir.
  2. HTML içinde menünün gireceği "slot" `<!--İçerik Başlangıç-->` ile
     `<!--İçerik Son-->` yorumları arası. Bu bölge parse edilir.
  3. Tüm metinsel satırlar bileşen aday'ı olarak alınır, fuzzy matcher'a
     verilir, eşleşenler bileşen kimliğine bağlanır.
  4. Bugünün menüsü `data/menus/YYYY-MM-DD.json` olarak yazılır, ek olarak
     `data/current.json` günceli yansıtır. Hiçbir şey bulunamazsa eski
     dosyalar dokunulmaz (hafta sonu / kapalı gün korunsun).

Çalıştırma:
  python scraper/scrape.py            # production: gerçek URL'den çeker
  python scraper/scrape.py --html X   # X dosyasını lokal olarak parse eder
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

from bs4 import BeautifulSoup, Comment

from matcher import FoodMatcher
from normalize import clean_display

URL = "https://unievi.firat.edu.tr/"
USER_AGENT = "yemekhane-scraper/0.1 (+github)"
ROOT = Path(__file__).resolve().parent.parent
FOODS_DIR = ROOT / "data" / "foods"
MENUS_DIR = ROOT / "data" / "menus"
CURRENT_FILE = ROOT / "data" / "current.json"
UNKNOWN_LOG = ROOT / "data" / "unknown_items.json"
TZ_TR = timezone(timedelta(hours=3))


def fetch_html(url: str = URL) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.read().decode("utf-8", errors="replace")


def extract_menu_region(html: str) -> str | None:
    """`<!--Üniversite Yemekhanesi Başlangıç-->` ile başlayan bölgeyi al.

    Bitiş için kapanış yorumu güvenilir değil, sonraki bölüm başlangıcına
    kadar kes. Sırasıyla: Birimden haberler / Ana sayfa son / İçerik Başlangıç.
    """
    start_pat = re.compile(r"<!--\s*Üniversite Yemekhanesi Başlangıç\s*-->", re.IGNORECASE)
    start = start_pat.search(html)
    if not start:
        return None

    # Bitiş adayları (hangisi daha önce gelirse onu al)
    end_candidates = [
        r"<!--\s*Üniversite Yemekhanesi\s*son",
        r"<!--\s*Ana sayfa son",
        r"<!--+\s*İçerik Başlangıç",
        r"<!---?Birimden haberler",
    ]
    rest = html[start.end():]
    cut = len(rest)
    for pat in end_candidates:
        m = re.search(pat, rest, re.IGNORECASE)
        if m and m.start() < cut:
            cut = m.start()
    region = rest[:cut].strip()
    return region or None


# Slot-içi "box" yapısı: <div class="box"><div class="box__content"><p>YEMEK</p></div></div>
def extract_items(region_html: str) -> list[str]:
    """Asıl menü bileşenleri `<div class="box">` içindeki `<p>` etiketleri."""
    soup = BeautifulSoup(region_html, "html.parser")
    for tag in soup(["script", "style"]):
        tag.decompose()

    items: list[str] = []
    seen: set[str] = set()

    # Birincil yol: box > box__content > p
    boxes = soup.find_all("div", class_="box")
    if boxes:
        for box in boxes:
            p = box.find("p")
            text = p.get_text(" ", strip=True) if p else box.get_text(" ", strip=True)
            line = clean_display(text)
            if _looks_like_food(line) and line.lower() not in seen:
                seen.add(line.lower())
                items.append(line)
        return items

    # Yedek yol: box yoksa tüm <p>/<li>'leri tara
    for el in soup.find_all(["p", "li"]):
        text = el.get_text(" ", strip=True)
        line = clean_display(text)
        if _looks_like_food(line) and line.lower() not in seen:
            seen.add(line.lower())
            items.append(line)
    return items


_DATE_RE = re.compile(r"\d{1,2}\s+\w+\s+\d{4}")


def _looks_like_food(line: str) -> bool:
    if not (2 <= len(line) <= 60):
        return False
    letters = sum(ch.isalpha() for ch in line)
    if letters < max(2, len(line) * 0.5):
        return False
    low = line.lower()
    # Başlık/tarih/uyarı satırları
    if "günün menüsü" in low or "günün menusu" in low:
        return False
    if _DATE_RE.search(line):
        return False
    if any(k in low for k in ("kcal", "kalori", "öğle", "akşam")):
        if len(line.split()) <= 3:
            return False
    return True


def extract_date(region_html: str) -> str | None:
    """`<h4 class="food-date">18 Mayıs 2026 Pazartesi</h4>` içeriği."""
    soup = BeautifulSoup(region_html, "html.parser")
    el = soup.find(class_="food-date")
    if el:
        return clean_display(el.get_text(" ", strip=True))
    return None


def today_iso() -> str:
    return datetime.now(TZ_TR).strftime("%Y-%m-%d")


def scrape(html: str | None = None) -> dict:
    if html is None:
        html = fetch_html()
    region = extract_menu_region(html)
    if region is None:
        return {"status": "no-slot", "items": [], "fetched_at": datetime.now(TZ_TR).isoformat()}
    items = extract_items(region)
    site_date = extract_date(region)
    if not items:
        return {
            "status": "empty-slot",
            "items": [],
            "site_date": site_date,
            "fetched_at": datetime.now(TZ_TR).isoformat(),
        }

    matcher = FoodMatcher(FOODS_DIR)
    components = []
    unknowns = []
    for raw in items:
        m = matcher.match(raw)
        if m["status"] == "matched":
            components.append({
                "raw": raw,
                "food_id": m["food_id"],
                "score": m["score"],
                "auto": True,
            })
        elif m["status"] == "suggest":
            components.append({
                "raw": raw,
                "food_id": m["food_id"],
                "score": m["score"],
                "auto": False,
                "needs_review": True,
            })
        else:
            components.append({"raw": raw, "food_id": None, "needs_review": True})
            unknowns.append(raw)

    return {
        "status": "ok",
        "date": today_iso(),
        "site_date": site_date,
        "fetched_at": datetime.now(TZ_TR).isoformat(),
        "components": components,
        "unknown_count": len(unknowns),
        "unknowns": unknowns,
    }


def save(result: dict) -> bool:
    """Sonucu data/ altına yaz. Hiçbir bileşen yoksa eski dosyalar korunur.
    Geri dönüş: yazıldı mı (True/False).
    """
    # Bileşen index'i her durumda güncel kalsın (admin paneli kullanır)
    rebuild_foods_index()

    if result["status"] != "ok":
        print(f"[scrape] status={result['status']}, mevcut dosyalar korunuyor")
        return False

    MENUS_DIR.mkdir(parents=True, exist_ok=True)
    date = result["date"]
    menu_file = MENUS_DIR / f"{date}.json"
    menu_file.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    CURRENT_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[scrape] yazıldı: {menu_file.name}, {len(result['components'])} bileşen, {result['unknown_count']} bilinmeyen")

    if result["unknowns"]:
        existing = []
        if UNKNOWN_LOG.exists():
            try:
                existing = json.loads(UNKNOWN_LOG.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                existing = []
        existing.append({"date": date, "items": result["unknowns"]})
        UNKNOWN_LOG.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    return True


def rebuild_foods_index() -> None:
    """data/foods/_index.json'ı tüm bileşen meta'larıyla yeniden üret.
    Admin paneli arama/listeleme için bu manifest'i okur."""
    entries = []
    for path in sorted(FOODS_DIR.glob("*.json")):
        if path.name.startswith("_"):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        entries.append({
            "id": data.get("id", path.stem),
            "name": data.get("name", ""),
            "category": data.get("category", ""),
            "is_generic": bool(data.get("is_generic", False)),
        })
    (FOODS_DIR / "_index.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--html", help="URL yerine yerel HTML dosyası kullan")
    args = ap.parse_args()

    if args.html:
        html = Path(args.html).read_text(encoding="utf-8", errors="replace")
    else:
        html = None

    result = scrape(html)
    save(result)
    print(json.dumps({"status": result["status"], "count": len(result.get("components", []))},
                     ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
