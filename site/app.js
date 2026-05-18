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

function renderComponent(c, food) {
  const div = document.createElement("article");
  div.className = "component" + (food ? "" : " unknown");

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

  status.textContent = current.date ? `Tarih: ${current.date}` : "—";
  updatedAt.textContent = trDate(current.fetched_at);

  if (!current.components || current.components.length === 0) {
    root.innerHTML = `<div class="empty">Bugün için menü görünmüyor.<br><small>Hafta sonu olabilir veya menü henüz yayınlanmamış olabilir.</small></div>`;
    return;
  }

  const foods = await loadFoodIndex(current);
  root.innerHTML = "";
  for (const c of current.components) {
    const food = c.food_id ? foods[c.food_id] : null;
    root.appendChild(renderComponent(c, food));
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
