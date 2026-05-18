# Bileşen fotoğrafları

Bu klasöre yemek bileşenlerinin fotoğrafları konur. Dosya adı, `data/foods/<id>.json` ile **birebir** aynı olmalı:

- `data/foods/bulgur-pilavi.json` → `images/foods/bulgur-pilavi.jpg`
- `data/foods/antep-tava.json`    → `images/foods/antep-tava.jpg`

**Önerilen:**
- JPG formatı (PNG da olur ama JSON'da `image: "...jpg"` yazıyor)
- 600x600 kare, ~150-300 KB

Admin panel (`/admin.html`) "Fotoğrafı indir" butonu otomatik olarak doğru isimle indirir, bu klasöre kopyalaman yeterli.
