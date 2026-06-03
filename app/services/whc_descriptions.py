"""
UNESCO WHC full texts from data/whc001.json (description_en, justification_en).
Used by AI and site enrichment – offline, no scraping required.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

WHC_FILE = Path(__file__).resolve().parents[2] / "data" / "whc001.json"


@lru_cache(maxsize=1)
def _whc_index() -> dict[str, dict[str, Any]]:
    if not WHC_FILE.is_file():
        return {}
    with WHC_FILE.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        return {}
    index: dict[str, dict[str, Any]] = {}
    for item in data:
        if not isinstance(item, dict):
            continue
        uid = str(item.get("id_no") or item.get("unesco_id") or "").strip()
        if uid:
            index[uid] = item
    return index


def get_whc_extended_texts(unesco_id: str) -> Optional[dict[str, str]]:
    """
    Returns description_en and justification_en for a UNESCO id (e.g. 404 = Acropolis).
    """
    uid = str(unesco_id or "").strip()
    if not uid:
        return None
    row = _whc_index().get(uid)
    if not row:
        return None

    description_en = (row.get("description_en") or row.get("short_description_en") or "").strip()
    justification_en = (row.get("justification_en") or "").strip()
    if not description_en and not justification_en:
        return None

    return {
        "description_en": description_en,
        "justification_en": justification_en,
        "name_en": (row.get("name_en") or "").strip(),
    }


def combined_ai_context_text(unesco_id: str) -> tuple[str, list[str]]:
    """Full English UNESCO narrative for AI (description + justification)."""
    extended = get_whc_extended_texts(unesco_id)
    if not extended:
        return "", []

    parts: list[str] = []
    sources: list[str] = []
    desc = extended.get("description_en") or ""
    just = extended.get("justification_en") or ""
    if desc:
        parts.append(desc)
        sources.append("whc001.json (description_en)")
    if just:
        parts.append(just)
        sources.append("whc001.json (justification_en)")
    return "\n\n".join(parts), sources
