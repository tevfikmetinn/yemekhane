# Bileşen şeması

Her bileşen `data/foods/<id>.json` dosyasında durur. `id` küçük harf, tire ile (örn. `bulgur-pilavi`, `tavuk-kizartma`).

```json
{
  "id": "bulgur-pilavi",
  "name": "Bulgur Pilavı",
  "aliases": ["bulgur pilavi", "domatesli bulgur pilavı"],
  "category": "pilav",
  "image": "images/foods/bulgur-pilavi.jpg",
  "portion_g": 200,
  "nutrition": {
    "kcal": 220,
    "protein_g": 6,
    "carb_g": 42,
    "fat_g": 3,
    "fiber_g": 4
  },
  "nutrition_source": "ai_estimate",
  "is_generic": false,
  "notes": "",
  "updated_at": "2026-05-16"
}
```

Alanlar:
- `id`: dosya adıyla aynı, fuzzy matcher buna göre çalışır.
- `name`: arayüzde gösterilecek isim.
- `aliases`: ek yazım varyantları. Normalize edilince hepsi karşılaştırılır, biri tutarsa eşleşme olur.
- `category`: `ana-yemek` | `pilav` | `corba` | `salata` | `tatli` | `icecek` | `ekmek` | `meyve` | `diger`
- `image`: opsiyonel — yoksa placeholder gösterilir.
- `portion_g`: tabldot porsiyon ağırlığı (yaklaşık).
- `nutrition`: AI tahmini, bir günde toplamak için ortalanmış değerler.
- `nutrition_source`: `ai_estimate` | `package` (yoğurt/ayran paketinden) | `manual`.
- `is_generic`: true ise "meyve" gibi kategori-bileşen (hangi meyve geldiği belirsiz).

Kategori örnekleri scraper için bilgi değil, sadece insanın hızlı taraması için.

Dosya adı `_` ile başlarsa (örn. bu dosya) yüklenmez.
