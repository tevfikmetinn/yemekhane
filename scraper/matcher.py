"""Yemek bileşeni fuzzy eşleştirici.

Bileşen kütüphanesindeki (data/foods/*.json) tüm alias'ları normalize edip
gelen yemek ismiyle karşılaştırır. Eşik üstü en yüksek skor = eşleşme.
"""

import difflib
import json
from pathlib import Path
from typing import Optional

from normalize import normalize

AUTO_MATCH = 0.88   # bu skorun üstü otomatik eşleşir
SUGGEST_MATCH = 0.70  # bu skorun altı "yeni yemek" sayılır


class FoodMatcher:
    def __init__(self, foods_dir: Path):
        self.foods_dir = Path(foods_dir)
        # alias_norm -> food_id eşlemesi (food_id = dosya adı .json'suz)
        self.alias_to_id: dict[str, str] = {}
        self.foods: dict[str, dict] = {}
        self._load()

    def _load(self) -> None:
        for path in sorted(self.foods_dir.glob("*.json")):
            if path.name.startswith("_"):
                continue
            food_id = path.stem
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                print(f"  [warn] {path.name} okunamadı: {e}")
                continue
            self.foods[food_id] = data
            for alias in [data.get("name", "")] + data.get("aliases", []):
                norm = normalize(alias)
                if norm:
                    self.alias_to_id[norm] = food_id

    def match(self, raw_name: str) -> dict:
        """Sonuç: {status, food_id, score, query}
        status: 'matched' | 'suggest' | 'unknown'
        """
        query = normalize(raw_name)
        if not query:
            return {"status": "unknown", "query": query, "raw": raw_name}

        # Tam eşleşme kestirme yolu
        if query in self.alias_to_id:
            food_id = self.alias_to_id[query]
            return {"status": "matched", "food_id": food_id, "score": 1.0, "query": query, "raw": raw_name}

        # En yakın aday
        candidates = list(self.alias_to_id.keys())
        if not candidates:
            return {"status": "unknown", "query": query, "raw": raw_name}

        best = difflib.get_close_matches(query, candidates, n=1, cutoff=SUGGEST_MATCH)
        if not best:
            return {"status": "unknown", "query": query, "raw": raw_name}

        alias = best[0]
        score = difflib.SequenceMatcher(None, query, alias).ratio()
        food_id = self.alias_to_id[alias]
        status = "matched" if score >= AUTO_MATCH else "suggest"
        return {
            "status": status,
            "food_id": food_id,
            "score": round(score, 3),
            "matched_alias": alias,
            "query": query,
            "raw": raw_name,
        }
