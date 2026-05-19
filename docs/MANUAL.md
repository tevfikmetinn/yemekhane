# 📖 Manuel Veri Yönetimi Rehberi

Bu rehber **terminal kullanmadan**, sadece **github.com** üzerinden tarayıcıda her şeyi nasıl yapacağını anlatır. Adım adım, 3 yaşındaki çocuğa anlatır gibi 🍼

> **Repo URL:** https://github.com/tevfikmetinn/yemekhane
>
> Her işlem buradan başlar. Bu sayfayı bookmark'la.

---

## 🗂️ Klasör yapısı (önce burayı anla)

```
yemekhane/
├── data/foods/         ← Her yemek için 1 JSON dosyası buradadır
├── images/foods/       ← Her yemek için 1 fotoğraf buradadır
├── data/current.json   ← Bugünün menüsü (BOT yazıyor, sen dokunma)
├── data/menus/         ← Geçmiş tüm günlerin menüleri (BOT yazıyor, sen dokunma)
└── site/               ← Frontend kodları (sen dokunma)
```

**Sen sadece** şu iki klasörü kullanacaksın:
- `data/foods/` → yemek bileşenleri (JSON dosyaları)
- `images/foods/` → yemek fotoğrafları (PNG/JPG)

---

## 📝 ISIMLENDIRME KURALLARI (en önemli!)

Bir bileşenin **ID'si** üç yerde **birebir aynı** olmak zorunda:
1. JSON dosya adı: `iskender-kofte.json`
2. JSON içindeki `"id"` alanı: `"iskender-kofte"`
3. Fotoğraf dosya adı: `iskender-kofte.png`

### ID nasıl yazılır?

- **Sadece** küçük harf
- **Sadece** İngilizce harf (a-z), rakam (0-9), tire (-)
- Boşluk yerine tire (-)
- Türkçe karakterleri dönüştür:

| Türkçe | İngilizce |
|---|---|
| ç → c | Ç → c |
| ğ → g | Ğ → g |
| ı → i | İ → i |
| ö → o | Ö → o |
| ş → s | Ş → s |
| ü → u | Ü → u |

### Örnekler

| Yemek adı | Doğru ID |
|---|---|
| İskender Köfte | `iskender-kofte` |
| Çoban Salata | `coban-salatasi` |
| Kuru Fasulye | `kuru-fasulye` |
| Tavuk Şinitzel | `tavuk-sinitzel` |
| Süt Mısır | `sut-misir` |

---

## 🟢 SENARYO 1 — Yepyeni yemek ekleme (örnek: İskender Köfte)

Diyelim ki bugün menüde "İSKENDER KÖFTE" yazıyor ama sitemiz bunu tanımıyor (🍽 emoji gösteriyor). Eklemek için:

### Adım 1: Fotoğrafı yükle (varsa)

1. https://github.com/tevfikmetinn/yemekhane adresine git
2. **`images`** klasörüne tıkla → **`foods`** klasörüne tıkla
3. Sağ üstte **"Add file"** → **"Upload files"**
4. Telefondan / bilgisayardan çektiğin fotoğrafı **sürükle bırak**
5. ⚠️ Foto adı **`iskender-kofte.png`** olmalı (önceden bilgisayarda yeniden adlandır)
6. Aşağıda commit mesajı kutusu — şöyle yaz: `foto: iskender kofte`
7. Yeşil **"Commit changes"** butonu

✅ Foto 1-2 dakika içinde canlıda görünür.

### Adım 2: JSON dosyası oluştur

1. Repo'ya geri dön → **`data`** klasörüne tıkla → **`foods`** klasörüne tıkla
2. Sağ üstte **"Add file"** → **"Create new file"**
3. Üstteki kutuya dosya adını yaz: **`iskender-kofte.json`**
4. Büyük metin kutusuna **aşağıdaki şablonu** yapıştır (sadece değerleri değiştir):

```json
{
  "id": "iskender-kofte",
  "name": "İskender Köfte",
  "aliases": [
    "iskender kofte",
    "iskender köftesi",
    "iskenderköfte"
  ],
  "category": "ana-yemek",
  "image": "images/foods/iskender-kofte.png",
  "portion_g": 220,
  "nutrition": {
    "kcal": 400,
    "protein_g": 22,
    "carb_g": 18,
    "fat_g": 26,
    "fiber_g": 2
  },
  "nutrition_source": "ai_estimate",
  "is_generic": false,
  "notes": "",
  "updated_at": "2026-05-20"
}
```

5. Şu alanları kendi yemeğin için değiştir:

| Alan | Ne yazacaksın |
|---|---|
| `"id"` | Yeni id (`"iskender-kofte"`) |
| `"name"` | Türkçe görünür isim (`"İskender Köfte"`) |
| `"aliases"` | Yemekhanenin yazabileceği farklı varyantlar — virgül + tırnak |
| `"category"` | Aşağıdaki tablodan seç |
| `"image"` | `"images/foods/iskender-kofte.png"` |
| `"portion_g"` | Tahmini gram |
| `"nutrition"` | AI'ya sor (Claude/Gemini/ChatGPT), ortalamasını yaz |
| `"notes"` | Ek bilgi (boş bırakabilirsin) |
| `"updated_at"` | Bugünün tarihi (`"2026-05-20"`) |

6. Aşağıda commit mesajı: `add: iskender kofte`
7. Yeşil **"Commit changes"** butonu

✅ ~2 dakika sonra **yemekhanem.vercel.app**'te yeni yemek görünür.

### Kategoriler (tek tek listesi)

| Değer | Açıklama |
|---|---|
| `"ana-yemek"` | Etli/kıymalı/tavuklu ana yemek |
| `"pilav"` | Pilav, makarna gibi tahıllı yan |
| `"corba"` | Çorba |
| `"salata"` | Salata, yoğurt, cacık |
| `"tatli"` | Tulumba, revani, sütlaç vs. |
| `"helva"` | Tahin/irmik helvası |
| `"icecek"` | Ayran |
| `"meyve"` | Elma, muz, üzüm vs. |
| `"ekmek"` | Ekmek |
| `"diger"` | Diğer (patates kızartması gibi garnitür) |

---

## 🟡 SENARYO 2 — Mevcut bileşeni güncellemek

Diyelim ki pirinç pilavının besin değerini yeniden hesapladın, daha doğru değer girmek istiyorsun.

1. Repo'ya git → **`data`** → **`foods`**
2. **`pirinc-pilavi.json`** dosyasına tıkla
3. Sağ üstte **kalem ikonu** (✏️ Edit this file)
4. Açılan editörde **`nutrition`** bölümünü değiştir:
   ```json
   "nutrition": {
     "kcal": 290,        ← Yeni değer
     "protein_g": 6,
     "carb_g": 55,
     "fat_g": 6,
     "fiber_g": 1
   },
   ```
5. **`"updated_at"`**'i bugünün tarihiyle değiştir (`"2026-05-20"`)
6. Aşağı kaydır, commit mesajı: `update: pirinc pilavi besin degeri`
7. Yeşil **"Commit changes"** butonu

✅ Site otomatik güncellenir.

---

## 🟠 SENARYO 3 — Fotoğraf değiştirmek

Diyelim ki tavuk kızartmanın daha güzel fotosunu çektin.

1. Repo'ya git → **`images`** → **`foods`**
2. **`tavuk-kizartma.png`** dosyasına tıkla
3. Sağ üstte **çöp kutusu ikonu** (🗑️ Delete this file) → **"Commit changes"**
4. Geri dön → **"Add file"** → **"Upload files"**
5. Yeni fotoyu sürükle (**adı `tavuk-kizartma.png` olmalı**)
6. Commit mesajı: `update: tavuk kizartma foto`
7. Yeşil **"Commit changes"**

✅ Eski foto gider, yenisi gelir, site güncellenir.

> 💡 **Daha hızlı yol:** Eski fotoyu silmeden direkt yenisini yükle, GitHub aynı isimle yüklenmek isteyince "üstüne yaz" diye sorar, "Yes" de.

---

## 🔴 SENARYO 4 — Bileşeni silmek

Diyelim ki "tahin-helvasi" bileşeninin artık menüye hiç gelmediğine emin oldun, silmek istiyorsun.

1. Repo'ya git → **`data`** → **`foods`** → **`tahin-helvasi.json`**
2. Sağ üstte **çöp kutusu ikonu**
3. Commit mesajı: `remove: tahin helvasi`
4. **"Commit changes"**
5. Aynısını **`images/foods/tahin-helvasi.png`** için de yap (foto'yu sil)

✅ Sistem bileşeni unutur. Menüde geçerse "yeni bileşen" rozetiyle gösterir.

---

## 🟣 SENARYO 5 — Admin panel ile yarı-otomatik ekleme

Eğer JSON'u el ile yazmaktan rahatsızsan, **admin paneli** form'la JSON üretir:

1. Tarayıcıda aç: **https://yemekhanem.vercel.app/admin.html**
2. Sol tarafta **"Bugünün durumu"** ve **bilinmeyen bileşenler** listelenir
3. Bilinmeyen yemeğe tıkla → form otomatik dolar
4. Form alanlarını tamamla:
   - Görünen isim, kategori, porsiyon, besin değerleri
   - Fotoğrafı seç (file input)
5. **"💾 JSON indir"** butonu → bilgisayarına `iskender-kofte.json` iner
6. **"📷 Fotoğrafı indir"** butonu → `iskender-kofte.png` iner
7. Bu iki dosyayı **yukarıdaki SENARYO 1**'deki gibi GitHub web arayüzünden yükle

✅ Form sayesinde JSON şablonunu el ile yazmazsın, panel hazırlar.

---

## 🔵 SENARYO 6 — Alias eklemek (yazım hatası yakalama)

Diyelim ki menüde "TAHIN HELVA" yazıyor ama site tanımıyor — çünkü mevcut JSON'da bu yazım yok.

1. **`data/foods/tahin-helvasi.json`** dosyasını aç (kalem ikonu)
2. `"aliases"` bölümüne yeni varyantı ekle:
   ```json
   "aliases": [
     "tahin helvasi",
     "tahin helva",
     "tahin h",
     "tahin.h",
     "tahin h."
   ],
   ```
3. Commit changes

✅ Bundan sonra menüde "TAHIN HELVA" yazsa bile sistem tanır.

---

## 🧪 Değişikliği canlıda görmek için

Her commit'ten sonra:
1. ~1-2 dakika bekle (Vercel otomatik deploy eder)
2. **yemekhanem.vercel.app**'i aç
3. **`Ctrl + Shift + R`** (hard refresh — eski cache temizler)
4. Yeni veri görünür ✓

> **Cache problemi olmaz** — vercel.json'da JS/CSS/HTML için `no-store` ayarı var. Her açılışta taze veri çekilir.

---

## ⚠️ DİKKAT EDİLECEK ŞEYLER

### ❌ Yapma:
- `data/current.json` dosyasına dokunma (bot yazıyor)
- `data/menus/` klasöründeki dosyalara dokunma (bot yazıyor)
- `data/foods/_index.json` dosyasına dokunma (otomatik üretiliyor)
- `data/foods/_schema.md` dosyasına dokunma
- ID'de Türkçe karakter, boşluk, büyük harf kullanma
- JSON syntax bozma (virgül, tırnak, parantez dikkat)

### ✅ Yap:
- ID'leri konsistent küçük harf-tire ile yaz
- Aliases'a olabildiğince yazım varyantını ekle
- Her güncellemede `updated_at` tarihini değiştir
- Commit mesajını açıklayıcı yaz (`add:`, `update:`, `remove:`, `foto:`)

---

## 🆘 Hata yaptığında geri al

GitHub web'de **her commit geri alınabilir**:

1. Repo'da üst tarafta **"X Commits"** linkini tıkla (örn. "47 Commits")
2. Geri almak istediğin commit'i bul
3. Sağ tarafta **"..."** → **"Revert"** seç → onayla

GitHub yeni bir commit oluşturur eski hali döndürerek. **Veri kaybı yok**, panik yapma.

---

## 📞 Sonra ne yapayım?

Sistem otomatik çalışıyor. Sen sadece:
- **Yeni yemek geldiğinde** → SENARYO 1 (yeni JSON + foto)
- **Veri güncellenecekse** → SENARYO 2 (JSON edit)
- **Foto eklenecek/değişecekse** → SENARYO 3 (foto upload)

Aksini düşünmen gereken bir şey yok. Hayat boyu bu üç senaryo işine yarayacak 🚀
