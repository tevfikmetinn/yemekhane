# Yemekhanem Projesi — Tam Devir Dökümanı

> Bu dökümanı **başka bir AI** veya **yeni bir yardımcı** okuyup projeyi devralabilir.
> Tüm sistemler, tüm endpoint'ler, tüm akışlar, kim ne yapıyor.
> Tarih: 2026-05-20

---

## 🎯 Proje nedir

Fırat Üniversitesi'nin Üniversite Evi yemekhanesinin günlük menüsünü çekip, **bileşen fotoğrafları + tahmini besin değerleri** ile zenginleştirip kullanıcıya gösteren bir öğrenci projesi. **Tamamen ücretsiz altyapı**, ana site GitHub + Vercel'de.

- **Canlı URL:** https://yemekhanem.vercel.app
- **Repo:** https://github.com/tevfikmetinn/yemekhane (public)
- **Manuel rehber:** `docs/MANUAL.md` (web'den veri yönetimi)
- **Bu döküman:** `docs/HANDOVER.md`

---

## 🏗️ Mimari — komple sistemler ve nerede çalışıyorlar

```
┌─────────────────────────────────────────────────────────────────────┐
│  unievi.firat.edu.tr  (Fırat Üniversitesi yemekhane sitesi)         │
│  Menü kaynak HTML'i                                                  │
└─────────────────────────────────────────────────────────────────────┘
                            ↑ HTTP GET (her 15 dk)
                            │
┌─────────────────────────────────────────────────────────────────────┐
│  GitHub Actions (yemekhane-bot)                                      │
│  Workflow: .github/workflows/scrape.yml                              │
│  - Python scraper çalıştırır                                         │
│  - Değişiklik varsa repo'ya commit + push                            │
└─────────────────────────────────────────────────────────────────────┘
                            ↑ workflow_dispatch
                            │
┌─────────────────────────────────────────────────────────────────────┐
│  Netlify Scheduled Function (yemekhanem.netlify.app)                 │
│  netlify/functions/scrape-trigger.js                                 │
│  - Schedule: */15 5-14 * * 1-5 (UTC) = TR 08:00-17:59 hafta içi      │
│  - Env: GITHUB_TOKEN (fine-grained PAT, Actions:write yetkili)       │
│  - GitHub API'ye POST atar → workflow_dispatch                       │
└─────────────────────────────────────────────────────────────────────┘
                            ↓ push event
                            │
┌─────────────────────────────────────────────────────────────────────┐
│  Vercel (Production deploy)                                          │
│  - Build: mkdir _site && cp site/* _site + data + images             │
│  - Output dir: _site                                                 │
│  - Webhook: manuel Deploy Hook (Plan B, GitHub auto-webhook olmadı)  │
└─────────────────────────────────────────────────────────────────────┘
                            ↓ HTTP
                            │
┌─────────────────────────────────────────────────────────────────────┐
│  yemekhanem.vercel.app   (ana site, statik HTML+JS+CSS)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repo dosya yapısı — tek tek ne işe yarar

```
yemekhane/
├── .github/
│   └── workflows/
│       ├── scrape.yml       # GitHub Actions cron + scraper
│       └── keepalive.yml    # Haftalık heartbeat (60-gün kuralı)
│
├── netlify/
│   └── functions/
│       └── scrape-trigger.js  # Schedule trigger, GitHub'ı çağırır
│
├── netlify.toml             # Netlify build config + schedule register
├── vercel.json              # Vercel build config + cache headers
│
├── scraper/
│   ├── scrape.py            # Ana script: HTML çek + parse + match
│   ├── matcher.py           # Fuzzy matcher (difflib)
│   ├── normalize.py         # Türkçe text normalize
│   └── requirements.txt     # beautifulsoup4
│
├── data/
│   ├── current.json         # Bugünün menüsü (BOT yazıyor)
│   ├── unknown_items.json   # Bilinmeyen yemek log'u (BOT)
│   ├── heartbeat.txt        # Keepalive timestamp (BOT)
│   ├── menus/               # Her gün ayrı arşiv
│   │   ├── 2026-05-18.json
│   │   ├── 2026-05-20.json
│   │   └── ...
│   └── foods/               # Bileşen kütüphanesi (33 dosya)
│       ├── _index.json      # Tüm bileşen meta (admin paneli okur, BOT günceller)
│       ├── _schema.md       # JSON şeması
│       ├── pirinc-pilavi.json
│       ├── karniyarik.json
│       └── ... (her yemek için ayrı JSON)
│
├── images/
│   └── foods/               # Yemek fotoğrafları (14 PNG)
│       ├── pirinc-pilavi.png
│       └── ...
│
├── site/                    # Frontend (Vercel serve eder)
│   ├── index.html
│   ├── style.css
│   ├── app.js               # Ana JS (menü render, fetch)
│   ├── admin.html           # Yarı-otomatik bileşen ekleme paneli
│   ├── admin.css
│   ├── admin.js
│   ├── robots.txt
│   └── sitemap.xml
│
└── docs/
    ├── MANUAL.md            # Web'den veri yönetimi rehberi
    ├── HANDOVER.md          # Bu döküman
    └── SESSION_2026-05-16.md
```

---

## 🔐 Token / yetki / hesap haritası

### GitHub Personal Access Token (PAT)
- **İsim:** `netlify-scrape-trigger`
- **Tip:** Fine-grained PAT
- **Yetki:** sadece `tevfikmetinn/yemekhane` repo'su, `Actions: Read and write`
- **Nerede saklı:** Netlify env var `GITHUB_TOKEN`
- **Yenileme:** Süresi varsa (kontrol: https://github.com/settings/tokens) yıllık yenilenmeli

### Netlify
- **Hesap:** tevfikmetinn (GitHub OAuth ile)
- **Proje:** `yemekhanem`
- **URL:** https://yemekhanem.netlify.app
- **Kullanım amacı:** SADECE scheduled function host eder, ana site Vercel'de
- **Free tier:** 125K function invocation/ay (bizim ~880/ay → %0.7 kullanım)

### Vercel
- **Hesap:** tevfikmetinn (GitHub OAuth ile)
- **Proje:** `yemekhane`
- **URL:** https://yemekhanem.vercel.app
- **Plan:** Hobby (free)
- **Webhook:** Manuel Deploy Hook URL kuruldu (GitHub repo'da webhook olarak)
  - Yeri: github.com/tevfikmetinn/yemekhane/settings/hooks
  - Plan B çünkü standart auto-webhook eklenmemişti
- **Build command:** `vercel.json` içinde
- **Cache:** JS/CSS/HTML için `no-store` (her güncelleme anında)

### Google Search Console
- **Domain:** yemekhanem.vercel.app
- **Verification:** `index.html`'de meta tag (`google-site-verification`)
- **Sitemap:** sitemap.xml submit edildi

---

## ⚙️ Otomasyon akışı — adım adım

**Her 15 dakikada (TR hafta içi 08:00-17:59):**

1. **Netlify schedule** `scrape-trigger` function'ını tetikler
   - Cron expression: `*/15 5-14 * * 1-5` (UTC)
   - Config yeri: `netlify.toml` içinde `[functions."scrape-trigger"]`
   
2. **Function** GitHub API'ye POST atar:
   - URL: `https://api.github.com/repos/tevfikmetinn/yemekhane/actions/workflows/scrape.yml/dispatches`
   - Header: `Authorization: Bearer $GITHUB_TOKEN`
   - Body: `{"ref":"main"}`

3. **GitHub Actions** workflow_dispatch ile `scrape.yml`'ı çalıştırır:
   - `actions/checkout@v5`
   - `actions/setup-python@v6` (python 3.11)
   - `pip install -r scraper/requirements.txt`
   - `python scraper/scrape.py`

4. **scrape.py** ne yapar:
   - `https://unievi.firat.edu.tr/` HTML çek
   - `<!--Üniversite Yemekhanesi Başlangıç-->` slot bul
   - `<div class="box">` içlerinden bileşen text'leri çıkar
   - `<h4 class="food-date">` tarih bilgisini al
   - `FoodMatcher` ile her bileşeni `data/foods/*.json` alias'larıyla fuzzy match
   - Sonuç: list of `{raw, food_id, score, auto/needs_review}`

5. **Idempotent save:**
   - Eğer `data/current.json` mevcut ve `(raw, food_id, status)` tuple'ları aynıysa → DOSYAYA DOKUNMA
   - Değişiklik varsa: `data/current.json` + `data/menus/YYYY-MM-DD.json` yaz
   - `menu_published_at` zaman damgası set et
   - `data/foods/_index.json` rebuild
   - Eğer bilinmeyen varsa `data/unknown_items.json`'a log

6. **Bot commit + push** (sadece değişiklik varsa):
   - `git config user.name yemekhane-bot`
   - `git add data/`
   - `git commit -m "menü güncelleme YYYY-MM-DD HH:MM UTC"`
   - `git push`

7. **Vercel webhook tetiklenir** (push event):
   - Manuel Deploy Hook URL'ine POST gelir
   - Vercel `_site/` klasörünü build eder
   - `cp site/* _site/ && cp -r data _site/data && cp -r images _site/images`
   - JS path düzeltme (`../data` → `./data`)
   - Deploy ~1 dakika

8. **Site canlıya iner** — kullanıcı `Ctrl+R` ile yenilediğinde yeni menüyü görür.

---

## 🧠 Önemli teknik detaylar

### Idempotent scraper karşılaştırması (kritik)

`scraper/scrape.py` → `save()` fonksiyonunda:

```python
def _comp_sig(c):
    status = "unknown" if not c.get("food_id") else ("matched" if c.get("auto") else "suggest")
    return (c.get("raw", ""), c.get("food_id") or "", status)

old_sigs = sorted(_comp_sig(c) for c in old.get("components", []))
new_sigs = sorted(_comp_sig(c) for c in result.get("components", []))
if old_sigs == new_sigs and old.get("date") == result.get("date"):
    return False  # menü aynı, dosyaya dokunma
```

**Önemli:** Sadece `raw` (text) karşılaştırması yetmez! Bileşen kütüphanesi güncellenince eşleşme değişir, bu da menü değişikliği sayılır. Üçlü `(raw, food_id, status)` karşılaştırma şart.

### Fuzzy matcher eşik değerleri

`scraper/matcher.py`:
- `AUTO_MATCH = 0.88` — otomatik eşleş
- `SUGGEST_MATCH = 0.70` — yaklaşık eşleş, "needs_review" rozeti
- < 0.70 — bilinmeyen, "yeni" rozeti

### Türkçe normalize

`scraper/normalize.py`:
- ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u
- I→ı, İ→i (TR upper/lower)
- Aksanları sıyır, noktalama temizle, tek boşluk

### Frontend timezone

`site/app.js`:
```javascript
function todayISO_TR() {
  const trMs = Date.now() + 3 * 3600 * 1000;
  return new Date(trMs).toISOString().slice(0, 10);
}
```

Browser timezone'una bakmaz, hep TR (UTC+3) hesaplar.

### Stale banner mantığı

`current.json.date` bugünden farklı ise:
- Hafta sonu (Cmt/Pzr) → "📅 Hafta sonu, yemekhane kapalı"
- Hafta içi → "⏳ Bugünün menüsü henüz yayınlanmadı"

Banner ayrı `<div id="banner-slot">`'ta, kartlar `<main id="menu-root">`'ta.
Eski tasarımda banner kart container'ında olduğu için `root.innerHTML = ""` ile siliniyordu. Düzeltildi.

---

## 🐛 Bilinen sorunlar ve geçmişte yaşanan bug'lar

| Sorun | Çözüm | Dosya/Yer |
|---|---|---|
| GitHub Actions schedule cron tembel (%50 atlama) | Netlify Scheduled Function eklendi (workflow_dispatch ile) | `netlify/functions/scrape-trigger.js` |
| `exports.config` schedule register olmuyordu | `netlify.toml`'a explicit `[functions."scrape-trigger"]` eklendi | `netlify.toml` |
| Setup Python step failure (deprecated v5) | `actions/setup-python@v6`, `actions/checkout@v5` | `scrape.yml`, `keepalive.yml` |
| Scraper idempotent bug (food_id değişimi yakalanmıyordu) | `(raw, food_id, status)` tuple karşılaştırması | `scrape.py:save()` |
| Stale banner kart'ları siliyordu | Banner ayrı `<div id="banner-slot">`'a alındı | `index.html`, `app.js` |
| Vercel CDN cache | `no-store` headers + `app.js?v=...` cache busting | `vercel.json`, `index.html` |
| Vercel-GitHub webhook eklenmemişti | Manuel Deploy Hook (Plan B) | Vercel Settings → Git → Deploy Hooks |
| Timezone hesabı UTC gece bozuluyordu | `Date.now() + 3*3600*1000` hardcoded TR | `app.js:todayISO_TR()` |
| Formsubmit.co kararsız (522 Cloudflare error) | Formu tamamen kaldırdı (yarın Telegram bot planlandıydı, vazgeçildi) | — |

---

## 🆘 Acil müdahale gereken durumlar

### Senaryo: Site eski menüyü gösteriyor, scrape çalışmıyor
1. https://github.com/tevfikmetinn/yemekhane/actions sayfasını kontrol et
2. Son "Scrape menu" run failure mı? → Hangi step?
3. `Setup Python` failure → action versiyonu deprecated, `scrape.yml`'i güncelle
4. `Run scraper` failure → Python kodu hatalı, log'a bak
5. `Commit changes` failure → repo permission veya conflict

### Senaryo: Netlify schedule durmuş
1. Netlify Dashboard → Functions → scrape-trigger → Logs
2. Last 24 hours filtre → otomatik entries var mı?
3. Yoksa: `netlify.toml`'da `[functions."scrape-trigger"]` bloğu sağlam mı? Schedule string standard cron mu?
4. Manuel test: `https://yemekhanem.netlify.app/.netlify/functions/scrape-trigger` URL'ini aç
5. Hâlâ tetiklenmiyorsa: Netlify env var `GITHUB_TOKEN` süresi dolmuş olabilir → yenile

### Senaryo: Yemekhane sitesi HTML yapısı değişti
1. `scraper/scrape.py` → `extract_menu_region()` regex'i kontrol et
2. `<!--Üniversite Yemekhanesi Başlangıç-->` yorum etiketi var mı?
3. `<div class="box"><p>` selector'u hâlâ çalışıyor mu?
4. Gerekirse `extract_items()` parser'ı güncelle
5. Lokal test: `python scraper/scrape.py --html dosya.html`

### Senaryo: Vercel deploy etmiyor
1. Vercel Dashboard → projeyi aç → Deployments
2. Son commit'in deploy'u var mı?
3. Yoksa: github.com/tevfikmetinn/yemekhane/settings/hooks → Vercel webhook → Recent Deliveries kontrol
4. Webhook 4xx/5xx dönüyorsa: yeni Deploy Hook oluştur (Vercel → Settings → Git → Deploy Hooks)

---

## 📊 Veri durumu (2026-05-20 itibarıyla)

- **33 bileşen** kütüphanede (`data/foods/*.json`)
- **14 fotoğraf** (`images/foods/*.png`)
- **2 menü arşivi** (`data/menus/`) — biriken veri
- **Mevcut bileşenler:**
  - Çorba (8): yayla, mercimek, ezogelin, harput, dövme, domates, tavuk suyu, şehriye
  - Ana yemek (6): antep tava, tavuk kızartma, fırın tavuk, fırın köfte, etli nohut, karnıyarık
  - Pilav/yan (3): pirinç pilavı, bulgur pilavı, peynirli makarna
  - Salata (4): mevsim salatası, yoğurt, cacık, turşu
  - Tatlı (3): tulumba, generic tatlı, tatli
  - Helva (2): irmik helvası, tahin helvası
  - Meyve (5): generic meyve, elma, muz, portakal, üzüm
  - İçecek (1): ayran
  - Ekmek (1): ekmek
  - Diğer (1): patates kızartması (garnitür)

---

## 🚧 Gelecek çalışmalar (kullanıcı isterse)

Kullanıcı 2026-05-20'de "şu an ki haliyle çalışsın bana yeter" dedi. Aşağıdakiler **opsiyonel**:

- **UI Paket A:** favicon, kategori renk kodu, loading skeleton, sticky header
- **Donut chart:** günün karb/protein/yağ dağılımı
- **İstatistik sayfası:** `/istatistik` — `data/menus/*.json` aggregate
- **Yıldız oylama:** Cloudflare Worker + KV (anonim IP-rate-limit)
- **UptimeRobot monitoring:** site/scrape başarısızlığı için uyarı
- **Custom domain:** `.is-a.dev` veya gerçek domain
- **Telegram bot:** geri bildirim için (kullanıcı şu an istemiyor)
- **Resmi tatil hardcoded:** 23 Nisan, 19 Mayıs vs. için frontend mesajı

---

## 📋 Kullanıcının her gün/her sefer yapacağı tek şey

**Yeni yemek geldiğinde:**
1. `docs/MANUAL.md`'ye bak veya
2. GitHub web'den `data/foods/<yemek-adi>.json` oluştur
3. Şablonu kopyala, değerleri değiştir
4. Commit
5. ~15 dakika içinde scraper kendisi tanır, site otomatik güncellenir

**Fotoğraf eklerken:**
1. `images/foods/<yemek-adi>.png` upload et
2. Commit
3. ~1-2 dakika sonra canlıda

**Hayat boyu sadece bu iki şey**. Otomasyonun gerisini bot ve cloud çalıştırır.
