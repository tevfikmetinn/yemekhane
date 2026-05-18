"""Türkçe yemek adı normalizasyonu — fuzzy match için tutarlı bir form üretir."""

import re
import unicodedata

_TR_LOWER = str.maketrans({"I": "ı", "İ": "i"})
_TR_FOLD = str.maketrans({
    "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u",
})


def tr_lower(text: str) -> str:
    return text.translate(_TR_LOWER).lower()


def normalize(text: str) -> str:
    """Karşılaştırma için kanonik form: küçük harf, aksansız, tek boşluklu."""
    if not text:
        return ""
    text = tr_lower(text)
    text = text.translate(_TR_FOLD)
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9 ]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def clean_display(text: str) -> str:
    """Görüntülenecek isim — sadece fazla boşluk ve gereksiz noktalama temizliği."""
    text = text.strip().strip(".,;:-•*").strip()
    text = re.sub(r"\s+", " ", text)
    return text
