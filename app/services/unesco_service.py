"""
UNESCO öppna data – hämtning och filcache.
Utan databas: läser/skriver data/unesco_cache.json
Med databas: upsert till world_heritage_sites vid sync.
"""
from __future__ import annotations

import asyncio
import html
import json
import re
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

import httpx
from sqlalchemy.orm import Session

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
CACHE_FILE = DATA_DIR / "unesco_cache.json"
SAMPLE_FILE = DATA_DIR / "unesco_sample.json"

# Officiell WHC JSON-lista (öppen data)
UNESCO_LIST_URL = "https://whc.unesco.org/en/list/json/"
UNESCO_SITE_URL_TEMPLATE = "https://whc.unesco.org/en/list/{unesco_id}/"
UNESCO_DETAIL_CONCURRENCY = 12


def unesco_site_image_url(unesco_id: str | None) -> str | None:
    """Officiell miniatyrbild från whc.unesco.org."""
    if not unesco_id:
        return None
    return f"https://whc.unesco.org/uploads/sites/site_{unesco_id}.jpg"


def get_unesco_photo_url(unesco_id: str) -> dict[str, str]:
    """
    Bästa tillgängliga UNESCO-bild-URL för ett världsarv.
    För de flesta platser: uploads/sites/site_<id>.jpg
    Valfritt: galleribild i data/unesco_gallery_photos.json
    """
    gallery_file = DATA_DIR / "unesco_gallery_photos.json"
    if gallery_file.exists():
        with gallery_file.open(encoding="utf-8") as f:
            gallery = json.load(f)
        override = gallery.get(str(unesco_id))
        if override and isinstance(override, str) and override.startswith("https://whc.unesco.org/"):
            return {"url": override, "source": "unesco_gallery"}

    return {"url": unesco_site_image_url(unesco_id), "source": "unesco_list"}


def _load_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "sites" in data:
        return data["sites"]
    return []


def _save_cache(sites: list[dict], source: str) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "count": len(sites),
        "sites": sites,
    }
    with CACHE_FILE.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def fetch_unesco_remote(enrich_long_descriptions: bool = False) -> list[dict]:
    """Hämtar från UNESCO WHC JSON; vid fel används sample-fil."""
    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            resp = client.get(UNESCO_LIST_URL)
            resp.raise_for_status()
            raw = resp.json()
    except Exception:
        return _normalize_sites(_load_json(SAMPLE_FILE), source="sample_fallback")

    sites: list[dict] = []
    if isinstance(raw, list):
        for item in raw:
            sites.append(_map_whc_item(item))
    elif isinstance(raw, dict):
        for item in raw.get("sites", raw.get("world_heritage_sites", [])):
            sites.append(_map_whc_item(item))
    if enrich_long_descriptions and sites:
        sites = enrich_sites_with_long_descriptions(sites)
    return _normalize_sites(sites, source="unesco_json")


def _extract_whc_description(item: dict) -> str:
    """Längsta tillgängliga UNESCO-beskrivning (öppna list-API:t varierar per fält)."""
    candidates = [
        item.get("brief_synthesis"),
        item.get("long_description"),
        item.get("description_long"),
        item.get("description"),
        item.get("justification"),
        item.get("statement"),
        item.get("brief_description"),
        item.get("short_description"),
    ]
    best = ""
    for raw in candidates:
        text = (raw or "").strip() if isinstance(raw, str) else ""
        if len(text) > len(best):
            best = text
    return best


def _strip_html_to_text(raw_html: str) -> str:
    text = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw_html)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</?(p|div|section|article|h1|h2|h3|h4|h5|h6|li|ul|ol)[^>]*>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html.unescape(text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def _extract_brief_synthesis_from_html(raw_html: str) -> str:
    text = _strip_html_to_text(raw_html)
    match = re.search(
        (
            r"Outstanding Universal Value\s+Brief Synthesis\s+(.+?)"
            r"(?=\s+(?:Criterion\s*\(|Integrity\s+|Authenticity\s+|Protection and management requirements\s+))"
        ),
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return ""
    return re.sub(r"\s+", " ", match.group(1)).strip()


@lru_cache(maxsize=512)
def fetch_unesco_brief_synthesis(unesco_id: str) -> str:
    """HÃ¤mtar UNESCO:s lÃ¤ngre text ('Outstanding Universal Value' > 'Brief Synthesis')."""
    uid = str(unesco_id or "").strip()
    if not uid:
        return ""

    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            resp = client.get(UNESCO_SITE_URL_TEMPLATE.format(unesco_id=uid))
            resp.raise_for_status()
    except Exception:
        return ""

    return _extract_brief_synthesis_from_html(resp.text)


async def _fetch_unesco_brief_synthesis_async(
    unesco_id: str,
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
) -> tuple[str, str]:
    uid = str(unesco_id or "").strip()
    if not uid:
        return uid, ""

    async with semaphore:
        try:
            resp = await client.get(UNESCO_SITE_URL_TEMPLATE.format(unesco_id=uid))
            resp.raise_for_status()
        except Exception:
            return uid, ""

    return uid, _extract_brief_synthesis_from_html(resp.text)


def _apply_long_description(site: dict, long_desc: str) -> dict:
    enriched = dict(site)
    current = (enriched.get("desc_en") or enriched.get("description") or "").strip()
    best = (long_desc or "").strip()
    if len(best) <= len(current):
        return enriched

    enriched["description"] = best
    enriched["description_long"] = best
    enriched["desc_en"] = best
    return enriched


async def _enrich_sites_with_long_descriptions_async(
    sites: list[dict],
    max_concurrency: int = UNESCO_DETAIL_CONCURRENCY,
) -> list[dict]:
    semaphore = asyncio.Semaphore(max(1, max_concurrency))
    ids = [str(site.get("unesco_id") or site.get("id") or "").strip() for site in sites]
    unique_ids = [uid for uid in dict.fromkeys(ids) if uid]

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        results = await asyncio.gather(*[
            _fetch_unesco_brief_synthesis_async(uid, client, semaphore)
            for uid in unique_ids
        ])

    by_id = {uid: text for uid, text in results if text}
    return [
        _apply_long_description(site, by_id.get(str(site.get("unesco_id") or site.get("id") or "").strip(), ""))
        for site in sites
    ]


def enrich_sites_with_long_descriptions(
    sites: list[dict],
    max_concurrency: int = UNESCO_DETAIL_CONCURRENCY,
) -> list[dict]:
    if not sites:
        return []
    try:
        return asyncio.run(
            _enrich_sites_with_long_descriptions_async(sites, max_concurrency=max_concurrency)
        )
    except RuntimeError:
        return [
            _apply_long_description(
                site,
                fetch_unesco_brief_synthesis(str(site.get("unesco_id") or site.get("id") or "").strip()),
            )
            for site in sites
        ]


def _map_whc_item(item: dict) -> dict:
    lat = item.get("latitude") or item.get("lat")
    lng = item.get("longitude") or item.get("lng") or item.get("lon")
    unesco_id = str(item.get("id_no") or item.get("id") or item.get("unesco_id") or "")
    description = _extract_whc_description(item)
    return {
        "unesco_id": unesco_id,
        "name": item.get("site") or item.get("name") or "Unknown",
        "description": description,
        "description_long": description,
        "desc_en": description,
        "country": item.get("states") or item.get("country") or "",
        "category": item.get("category") or "",
        "latitude": float(lat) if lat is not None else None,
        "longitude": float(lng) if lng is not None else None,
        "image_url": unesco_site_image_url(unesco_id),
        "year_inscribed": item.get("date_inscribed") or item.get("year_inscribed"),
    }


def _normalize_sites(sites: list[dict], source: str) -> list[dict]:
    out = []
    for s in sites:
        if not s.get("name"):
            continue
        lat = s.get("latitude")
        lng = s.get("longitude")
        desc = (s.get("description") or "").strip()
        out.append({
            "unesco_id": str(s.get("unesco_id") or s.get("id") or ""),
            "name": s["name"],
            "description": desc,
            "desc_en": s.get("desc_en") or desc,
            "country": s.get("country") or "",
            "category": s.get("category") or "",
            "latitude": lat,
            "longitude": lng,
            "image_url": unesco_site_image_url(str(s.get("unesco_id") or s.get("id") or "")),
            "year_inscribed": s.get("year_inscribed"),
            "_source": source,
        })
    return out


def get_cached_sites() -> list[dict]:
    if CACHE_FILE.exists():
        with CACHE_FILE.open(encoding="utf-8") as f:
            data = json.load(f)
        return data.get("sites", [])
    return _load_json(SAMPLE_FILE)


def sync_unesco(db: Optional[Session] = None) -> dict[str, Any]:
    from app.models.site import WorldHeritageSite

    sites = fetch_unesco_remote(enrich_long_descriptions=True)
    if not sites:
        sites = _normalize_sites(_load_json(SAMPLE_FILE), source="sample_only")
    _save_cache(sites, source="sync")

    imported = 0
    if db is not None:
        for s in sites:
            if s.get("latitude") is None or s.get("longitude") is None:
                continue
            uid = s.get("unesco_id") or s["name"]
            existing = (
                db.query(WorldHeritageSite)
                .filter(WorldHeritageSite.unesco_id == uid)
                .first()
            )
            location = f"POINT({s['longitude']} {s['latitude']})"
            if existing:
                existing.name = s["name"]
                existing.description = s["description"]
                existing.country = s["country"]
                existing.location = location
            else:
                db.add(
                    WorldHeritageSite(
                        unesco_id=uid,
                        name=s["name"],
                        description=s["description"],
                        country=s["country"],
                        category=s.get("category"),
                        location=location,
                        image_url=s.get("image_url"),
                        year_inscribed=s.get("year_inscribed"),
                    )
                )
            imported += 1
        try:
            db.commit()
        except Exception:
            db.rollback()
            imported = 0

    return {
        "success": True,
        "cached_count": len(sites),
        "db_imported": imported,
        "cache_file": str(CACHE_FILE),
    }


def get_site_from_cache(unesco_id: str) -> Optional[dict]:
    for s in get_cached_sites():
        if str(s.get("unesco_id")) == unesco_id or str(s.get("id")) == unesco_id:
            return s
    return None
