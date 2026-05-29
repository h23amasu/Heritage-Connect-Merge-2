"""
Router: UNESCO-data – cache och synk.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.site_image_service import resolve_site_photo
from app.services.unesco_service import get_cached_sites, get_site_from_cache, sync_unesco

router = APIRouter(prefix="/api/unesco", tags=["UNESCO"])


@router.get("/sites")
def list_cached_sites():
    """Lista cachade världsarv (ingen registrering krävs för annons)."""
    sites = get_cached_sites()
    return {"success": True, "count": len(sites), "sites": sites}


@router.get("/sites/{unesco_id}/photo")
def get_site_photo(unesco_id: str, name: str | None = None, fallback: bool = True):
    """Bild-URL för världsarv (officiell UNESCO-bild)."""
    _ = name, fallback
    photo = resolve_site_photo(unesco_id)
    if not photo.get("url"):
        raise HTTPException(status_code=404, detail="No photo for this site")
    return {"success": True, "unesco_id": unesco_id, **photo}


@router.get("/sites/{unesco_id}")
def get_cached_site(unesco_id: str):
    site = get_site_from_cache(unesco_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not in cache")
    return {"success": True, "site": site}


@router.post("/sync")
def sync_sites(db: Session = Depends(get_db)):
    """
    Hämtar från UNESCO öppna data och uppdaterar cache (+ databas om tillgänglig).
    """
    try:
        result = sync_unesco(db)
    except Exception:
        result = sync_unesco(None)
    return result
