# Yemekhane
**Link: [yemekhanem.vercel.app](https://yemekhanem.vercel.app/)**

Yemekhane menüsünü zenginleştirilmiş halde gösteren bir öğrenci projesi. Ham yemek isimlerinin yanına bileşen fotoğrafları, tahmini porsiyon ağırlıkları ve yapay zeka destekli ortalama besin değerleri ekler.

> ⚠️ **Bu sitenin hiçbir resmiyeti yoktur, hiçbir resmi kurumla bağlantılı değildir.** Veri kaynağı herkese açık adresler, kamuya açık kaynaklardan ve kişisel beyanlardan derlenip otomatik olarak çekilmektedir. Fotoğraflar ve besin değerleri **tahminidir**; yapay zeka destekli ortalamalardır. Hiçbir resmiyet, garanti veya sağlık önerisi içermez ve sorumluluk kabul edilmez.

## Mimari

```
yemekhane/
├── scraper/                # 
│   ├── normalize.py        # 
│   ├── matcher.py          # 
│   └── scrape.py           # 
├── data/
│   ├── foods/              # 
│   ├── menus/              # 
│   └── current.json        # 
├── images/foods/           # 
├── site/                   # 
│   ├── index.html
│   ├── app.js
│   └── style.css
└── .github/workflows/
    ├── scrape.yml          # 
    └── deploy.yml          # 
```


## Yasal uyarı

Bu proje:

- **Resmi değildir.** Resmi kurum ve Üniversite ile bir bağı veya onayı yoktur.
- **Tüketim önerisi değildir.** Besin değerleri yapay zeka tahminidir, hatalı olabilir. Alerji, diyet veya tıbbi karar için kullanılmamalıdır.
- **Veri kaynağı kamuya açıktır.** Herkesin erişebildiği, yemekhane ana sayfasındaki herkese görünür HTML işlenir; üyelik gerektiren veya korumalı içeriğe erişilmez.
- Telif veya kaldırma talebi için lütfen issue açın.

## Lisans

MIT
