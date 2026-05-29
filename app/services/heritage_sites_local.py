"""Lokal UNESCO-lista (data/heritage-sites.json) – delad av geo-demo och landningssida."""
from __future__ import annotations

import json
import math
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "heritage-sites.json"


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


@lru_cache(maxsize=1)
def get_heritage_sites() -> tuple[dict[str, Any], ...]:
    if not DATA_FILE.is_file():
        return tuple()
    with DATA_FILE.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        return tuple()
    return tuple(data)


def find_site_by_ref(site_ref: str) -> Optional[dict[str, Any]]:
    ref = str(site_ref or "").strip()
    if not ref:
        return None
    for site in get_heritage_sites():
        uid = str(site.get("unesco_id") or site.get("id") or "")
        if uid == ref or str(site.get("name", "")).lower() == ref.lower():
            return site
    return None


def find_closest_site(lat: float, lng: float) -> tuple[Optional[dict[str, Any]], float]:
    closest: Optional[dict[str, Any]] = None
    min_dist = float("inf")
    for site in get_heritage_sites():
        try:
            slat = float(site["latitude"])
            slng = float(site["longitude"])
        except (KeyError, TypeError, ValueError):
            continue
        dist = haversine_km(lat, lng, slat, slng)
        if dist < min_dist:
            min_dist = dist
            closest = site
    return closest, min_dist
