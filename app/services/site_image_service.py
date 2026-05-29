"""Bild-URL för världsarv – endast officiella UNESCO-bilder."""
from __future__ import annotations

from app.services.unesco_service import get_unesco_photo_url


def resolve_site_photo(
    unesco_id: str,
    site_name: str | None = None,
    *,
    allow_fallback: bool = True,
) -> dict[str, str | None]:
    """Returnerar UNESCO-bild-URL. site_name och allow_fallback behålls för API-kompatibilitet."""
    _ = site_name, allow_fallback
    photo = get_unesco_photo_url(unesco_id)
    return {
        "url": photo.get("url"),
        "fallback_url": None,
        "source": photo.get("source", "unesco_list"),
    }
