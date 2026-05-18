// Admin paneli — yerel form + JSON/foto indirme. Hiçbir sunucu çağrısı yok.
// Mevcut bileşenleri ve günün menüsünü okumak için fetch() kullanır.

const DATA_BASE = "../data";  // GHA deploy step bu yolları "./data" olarak değiştirir

const $ = (sel) => document.querySelector(sel);
const form = $("#food-form");
const photoInput = $("#photo-input");
const photoPreview = $("#photo-preview");
const photoDownloadBtn = $("#btn-download-photo");
const jsonDownloadBtn = $("#btn-download-json");
const formTitle = $("#form-title");
const statusEl = $("#form-status");

let currentMenu = null;
let foodIndex = []; // mevcut bileşen meta listesi
let selectedPhotoBlob = null;

async function loadJSON(path) {
  const r = await fetch(path, { cache: "no-store" });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function autofillIdFromName() {
  const name = form.elements["name"].value;
  if (name && !form.elements["id"].value) {
    form.elements["id"].value = slugify(name);
  }
}

function fillForm(data) {
  form.reset();
  if (!data) return;
  form.elements["id"].value = data.id || "";
  form.elements["name"].value = data.name || "";
  form.elements["aliases"].value = (data.aliases || []).join(", ");
  form.elements["category"].value = data.category || "ana-yemek";
  form.elements["portion_g"].value = data.portion_g ?? 200;
  const n = data.nutrition || {};
  form.elements["kcal"].value = n.kcal ?? 0;
  form.elements["protein_g"].value = n.protein_g ?? 0;
  form.elements["carb_g"].value = n.carb_g ?? 0;
  form.elements["fat_g"].value = n.fat_g ?? 0;
  form.elements["fiber_g"].value = n.fiber_g ?? 0;
  form.elements["nutrition_source"].value = data.nutrition_source || "ai_estimate";
  form.elements["notes"].value = data.notes || "";
  form.elements["is_generic"].checked = !!data.is_generic;
  formTitle.textContent = `Düzenle: ${data.name || data.id}`;
}

function collectForm() {
  const f = form.elements;
  const id = f["id"].value.trim();
  if (!/^[a-z0-9\-]+$/.test(id)) {
    throw new Error("id küçük harf, rakam ve tire içermeli (örn. 'izmir-koftesi')");
  }
  const aliases = f["aliases"].value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  return {
    id,
    name: f["name"].value.trim(),
    aliases,
    category: f["category"].value,
    image: `images/foods/${id}.jpg`,
    portion_g: Number(f["portion_g"].value) || 0,
    nutrition: {
      kcal: Number(f["kcal"].value) || 0,
      protein_g: Number(f["protein_g"].value) || 0,
      carb_g: Number(f["carb_g"].value) || 0,
      fat_g: Number(f["fat_g"].value) || 0,
      fiber_g: Number(f["fiber_g"].value) || 0,
    },
    nutrition_source: f["nutrition_source"].value,
    is_generic: f["is_generic"].checked,
    notes: f["notes"].value.trim(),
    updated_at: new Date().toISOString().slice(0, 10),
  };
}

function download(filename, blob) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
}

function setStatus(msg, ok = true) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? "var(--muted)" : "#b00020";
}

// ── Bugünün durumu ─────────────────────────────────────────────
async function renderToday() {
  const summary = $("#today-summary");
  try {
    currentMenu = await loadJSON(`${DATA_BASE}/current.json`);
  } catch {
    summary.innerHTML = `<span class="muted">Henüz veri yok (hafta sonu / scrape henüz çalışmamış).</span>`;
    return;
  }
  const date = currentMenu.site_date || currentMenu.date || "—";
  const list = (currentMenu.components || [])
    .map(c => `<span class="meal">• ${c.raw} ${c.food_id ? `<small class="muted">→ ${c.food_id}</small>` : `<span class="pill">YENİ</span>`}</span>`)
    .join("");
  summary.innerHTML = `<strong>${date}</strong>${list || '<div class="muted">menü boş</div>'}`;

  const review = (currentMenu.components || []).filter(c => !c.food_id || c.needs_review);
  if (review.length) {
    $("#unknowns-block").hidden = false;
    $("#unknowns-count").textContent = review.length;
    $("#unknowns-list").innerHTML = review
      .map(c => `<li data-raw="${encodeURIComponent(c.raw)}"><span>${c.raw}</span><small>${c.food_id ? `~${c.food_id}` : "yeni"}</small></li>`)
      .join("");
    $("#unknowns-list").querySelectorAll("li").forEach(li => {
      li.addEventListener("click", () => {
        const raw = decodeURIComponent(li.dataset.raw);
        form.reset();
        form.elements["name"].value = raw
          .toLowerCase()
          .replace(/\b\w/g, ch => ch.toUpperCase());
        form.elements["aliases"].value = raw.toLowerCase();
        autofillIdFromName();
        formTitle.textContent = `Yeni: ${raw}`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }
}

// ── Mevcut bileşenler listesi ─────────────────────────────────
async function loadExistingIndex() {
  // data/foods/ altındaki dosyaları statik olarak listeleyemeyiz.
  // Bunun yerine bir manifest dosyası kullanıyoruz: data/foods/_index.json
  try {
    foodIndex = await loadJSON(`${DATA_BASE}/foods/_index.json`);
  } catch {
    foodIndex = [];
  }
  renderExisting("");
}

function renderExisting(q) {
  const list = $("#existing-list");
  const items = foodIndex
    .filter(f => !q || f.id.includes(q) || (f.name || "").toLowerCase().includes(q))
    .sort((a, b) => a.id.localeCompare(b.id));
  list.innerHTML = items
    .map(f => `<li data-id="${f.id}"><span>${f.name || f.id}</span><small>${f.category || ""}</small></li>`)
    .join("");
  list.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", async () => {
      try {
        const data = await loadJSON(`${DATA_BASE}/foods/${li.dataset.id}.json`);
        fillForm(data);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setStatus(`yüklenemedi: ${e.message}`, false);
      }
    });
  });
}

// ── Olay bağlamaları ──────────────────────────────────────────
form.elements["name"].addEventListener("blur", autofillIdFromName);

photoInput.addEventListener("change", (ev) => {
  const f = ev.target.files?.[0];
  if (!f) { photoPreview.innerHTML = "Fotoğraf seçilmedi"; photoDownloadBtn.disabled = true; return; }
  selectedPhotoBlob = f;
  photoDownloadBtn.disabled = false;
  const url = URL.createObjectURL(f);
  photoPreview.innerHTML = `<img src="${url}" alt="preview">`;
});

photoDownloadBtn.addEventListener("click", () => {
  if (!selectedPhotoBlob) return;
  const id = form.elements["id"].value.trim() || "yeni";
  const ext = (selectedPhotoBlob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  download(`${id}.${ext}`, selectedPhotoBlob);
});

jsonDownloadBtn.addEventListener("click", () => {
  try {
    const data = collectForm();
    const blob = new Blob([JSON.stringify(data, null, 2) + "\n"], { type: "application/json" });
    download(`${data.id}.json`, blob);
    setStatus(`✓ ${data.id}.json indirildi — data/foods/ altına kopyala`);
  } catch (e) {
    setStatus(e.message, false);
  }
});

$("#search-existing").addEventListener("input", (e) => {
  renderExisting(e.target.value.trim().toLowerCase());
});

// ── Boot ──────────────────────────────────────────────────────
(async () => {
  await Promise.all([renderToday(), loadExistingIndex()]);
})().catch(e => setStatus(`hata: ${e.message}`, false));
