// Statik veri okur, menüyü render eder. Sunucu yok.
const DATA_BASE = "../data";     // GitHub Pages root için "./data" yapılacak (deploy adımı)
const IMG_BASE = "../images";

async function loadJSON(path) {
  const resp = await fetch(path, { cache: "no-store" });
  if (!resp.ok) throw new Error(`${path}: ${resp.status}`);
  return resp.json();
}

function fmt(n, digits = 0) {
  if (n == null || isNaN(n)) return "–";
  return Number(n).toFixed(digits);
}

function trDate(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" });
}

function trTime(iso) {
  if (!iso) return "–";
  const d = new Date(iso);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function renderComponent(c, food, foodIndex) {
  const div = document.createElement("article");
  div.className = "component" + (food ? "" : " unknown") + (food?.is_generic ? " generic" : "");

  const thumb = document.createElement("div");
  thumb.className = "thumb";
  if (food && food.image) {
    const img = document.createElement("img");
    img.src = `${IMG_BASE}/${food.image.replace(/^images\//, "")}`;
    img.alt = food.name;
    img.onerror = () => { thumb.textContent = "🍽"; thumb.querySelector("img")?.remove(); };
    thumb.appendChild(img);
  } else {
    thumb.textContent = "🍽";
  }

  const body = document.createElement("div");
  body.className = "body";
  const h3 = document.createElement("h3");
  h3.textContent = food ? food.name : c.raw;
  if (!food) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "yeni · görseli yok";
    h3.appendChild(badge);
  } else if (food.is_generic) {
    const badge = document.createElement("span");
    badge.className = "badge generic-badge";
    badge.textContent = "tür belirsiz";
    h3.appendChild(badge);
  } else if (c.needs_review) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "yaklaşık eşleşme";
    h3.appendChild(badge);
  }
  body.appendChild(h3);

  const meta = document.createElement("div");
  meta.className = "meta";
  if (food) {
    meta.textContent = `${food.category || ""} · ~${food.portion_g || "?"} g porsiyon`;
  } else {
    meta.textContent = `Bu bileşen henüz veritabanında yok`;
  }
  body.appendChild(meta);

  // Generic ise: aynı kategorideki spesifik bileşenleri listele
  if (food?.is_generic && foodIndex) {
    const variants = foodIndex
      .filter(e => e.category === food.category && !e.is_generic)
      .map(e => e.name)
      .filter(Boolean);
    if (variants.length) {
      const note = document.createElement("div");
      note.className = "generic-note";
      note.innerHTML = `<small>📋 Olası seçenekler: <strong>${variants.join(" · ")}</strong></small>
        <small class="muted">Görsel ve değerler en sık çıkan örnek içindir, gerçek menü farklı olabilir.</small>`;
      body.appendChild(note);
    }
  }

  const nut = document.createElement("div");
  nut.className = "nut";
  if (food && food.nutrition) {
    nut.innerHTML = `<span class="big">${fmt(food.nutrition.kcal)} kcal</span>
      P ${fmt(food.nutrition.protein_g)} · K ${fmt(food.nutrition.carb_g)} · Y ${fmt(food.nutrition.fat_g)}`;
  } else {
    nut.textContent = "–";
  }

  div.append(thumb, body, nut);
  return div;
}

async function loadFoodIndex(currentData) {
  // Sadece şu an menüde olan food_id'leri yükle (gereksiz request olmasın)
  const ids = [...new Set(currentData.components.map(c => c.food_id).filter(Boolean))];
  const map = {};
  await Promise.all(ids.map(async (id) => {
    try {
      map[id] = await loadJSON(`${DATA_BASE}/foods/${id}.json`);
    } catch (e) {
      console.warn("food yüklenemedi:", id, e);
    }
  }));
  return map;
}

async function loadFullIndex() {
  // _index.json — tüm bileşenlerin meta listesi (generic kartların "olası seçenekler"i için)
  try {
    return await loadJSON(`${DATA_BASE}/foods/_index.json`);
  } catch (e) {
    return [];
  }
}

function computeTotals(components, foods) {
  const t = { kcal: 0, protein_g: 0, carb_g: 0, fat_g: 0 };
  let counted = 0;
  for (const c of components) {
    const f = c.food_id && foods[c.food_id];
    if (!f || !f.nutrition) continue;
    t.kcal += +f.nutrition.kcal || 0;
    t.protein_g += +f.nutrition.protein_g || 0;
    t.carb_g += +f.nutrition.carb_g || 0;
    t.fat_g += +f.nutrition.fat_g || 0;
    counted++;
  }
  return { ...t, counted };
}

function todayISO_TR() {
  // Her zaman Türkiye saati (UTC+3, DST yok) - tarayıcı saat dilimine bağımsız
  const trMs = Date.now() + 3 * 3600 * 1000;
  return new Date(trMs).toISOString().slice(0, 10);
}

function dayContext(menuDate) {
  // Bugün vs menü tarihi farkı + hafta sonu kontrolü
  const todayStr = todayISO_TR();
  // UTC parse - getDay() yerel timezone kullanmaması için
  const [y, m, d] = todayStr.split("-").map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));
  const dow = today.getUTCDay(); // 0=Pzr, 6=Cmt
  const isWeekend = dow === 0 || dow === 6;
  const isStale = menuDate && menuDate !== todayStr;
  return { todayStr, isWeekend, isStale, dow };
}

async function main() {
  const root = document.getElementById("menu-root");
  const status = document.getElementById("status-line");
  const totalsBox = document.getElementById("totals");
  const updatedAt = document.getElementById("updated-at");

  let current;
  try {
    current = await loadJSON(`${DATA_BASE}/current.json`);
  } catch (e) {
    root.innerHTML = `<div class="empty">Henüz menü verisi yok.<br><small>Hafta içi 09:00 sonrası tekrar bak.</small></div>`;
    status.textContent = "Veri bulunamadı";
    return;
  }

  const ctx = dayContext(current.date);

  status.textContent = current.site_date || current.date || "—";

  // Menü yayın bilgisi: "Menü yayınlandı: 09:23 · Son kontrol: 14:45"
  const publishedLine = document.getElementById("published-line");
  if (publishedLine) {
    const pub = current.menu_published_at;
    const check = current.fetched_at;
    if (pub) {
      const sameDay = pub.slice(0, 10) === (check || "").slice(0, 10);
      publishedLine.innerHTML = sameDay
        ? `Menü yayınlandı: <strong>${trTime(pub)}</strong> · Son kontrol: ${trTime(check)} · `
        : `Menü tarihi: <strong>${trDate(pub)}</strong> · Son kontrol: ${trDate(check)} · `;
    } else if (check) {
      publishedLine.innerHTML = `Son güncelleme: <strong>${trDate(check)}</strong> · `;
    }
  }
  if (updatedAt) updatedAt.textContent = trDate(current.fetched_at); // legacy fallback

  // Veri yok / boş durum
  if (!current.components || current.components.length === 0) {
    if (ctx.isWeekend) {
      root.innerHTML = `<div class="empty">📅 Hafta sonu, yemekhane kapalı.<br><small>Pazartesi sabahı yeni menü gelir.</small></div>`;
    } else {
      root.innerHTML = `<div class="empty">Bugün için menü henüz yayınlanmadı.<br><small>Genelde 09:00 civarı yayınlanır, biraz sonra tekrar bak.</small></div>`;
    }
    return;
  }

  // Veri var ama tarih bugünle eşleşmiyor (eski menü) — banner AYRI slot'a
  const bannerSlot = document.getElementById("banner-slot");
  if (ctx.isStale && bannerSlot) {
    let msg;
    if (ctx.isWeekend) {
      msg = `📅 Hafta sonu — yemekhane kapalı.<br><small>Aşağıda son hafta içi menüsü görünüyor (<strong>${current.site_date || current.date}</strong>). Pazartesi sabahı yeni menü gelir.</small>`;
    } else {
      msg = `⏳ Bugünün menüsü henüz yayınlanmadı.<br><small>Aşağıda son güncel menü (<strong>${current.site_date || current.date}</strong>). Genelde 09:00 civarı güncellenir.</small>`;
    }
    bannerSlot.innerHTML = `<div class="stale-banner">${msg}</div>`;
  } else if (bannerSlot) {
    bannerSlot.innerHTML = "";
  }

  const [foods, fullIndex] = await Promise.all([
    loadFoodIndex(current),
    loadFullIndex(),
  ]);
  root.innerHTML = "";
  for (const c of current.components) {
    const food = c.food_id ? foods[c.food_id] : null;
    root.appendChild(renderComponent(c, food, fullIndex));
  }

  const totals = computeTotals(current.components, foods);
  if (totals.counted > 0) {
    document.getElementById("t-kcal").textContent = fmt(totals.kcal);
    document.getElementById("t-protein").textContent = fmt(totals.protein_g);
    document.getElementById("t-carb").textContent = fmt(totals.carb_g);
    document.getElementById("t-fat").textContent = fmt(totals.fat_g);
    totalsBox.hidden = false;
  }
}

main().catch(err => {
  console.error(err);
  document.getElementById("menu-root").innerHTML =
    `<div class="empty">Bir şeyler ters gitti: ${err.message}</div>`;
});
