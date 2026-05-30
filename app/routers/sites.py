"""
Router: World Heritage Sites
Handles every endpoint related to heritage sites.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID

from app.core.config import settings
from app.core.database import get_db
from app.models.site import WorldHeritageSite
from app.schemas import SiteCreate, SiteResponse
from app.services.geofencing_service import haversine_km
from app.services.heritage_sites_local import find_closest_site, find_site_by_ref
from app.services.unesco_service import get_cached_sites

router = APIRouter(prefix="/api/sites", tags=["Sites"])


def _demo_closest(lat: float, lng: float) -> dict:
    best, dist_km = find_closest_site(lat, lng)
    if not best:
        raise HTTPException(status_code=404, detail="No sites in demo data")
    uid = str(best.get("unesco_id") or best.get("id") or "")
    return {
        "id": uid,
        "unesco_id": uid,
        "name": best.get("name"),
        "description": best.get("desc_en") or best.get("description"),
        "country": best.get("country"),
        "category": best.get("category"),
        "latitude": best.get("latitude"),
        "longitude": best.get("longitude"),
        "image_url": best.get("image_url"),
        "year_inscribed": best.get("year_inscribed"),
        "distance_m": dist_km * 1000,
    }


def _best_site_description(site: dict, lang: str = "sv") -> str:
    lang = (lang or "sv").lower()[:2]
    desc_en = (site.get("desc_en") or site.get("description") or "").strip()
    localized = (site.get(f"desc_{lang}") or "").strip()
    if lang == "sv" and localized:
        return localized
    if localized and desc_en and len(localized) < len(desc_en) * 0.6:
        return desc_en
    return localized or desc_en or ""


def _public_site_payload(site: dict, lang: str = "sv") -> dict:
    lang = (lang or "sv").lower()[:2]
    description = _best_site_description(site, lang)
    uid = str(site.get("unesco_id") or site.get("id") or "")
    return {
        "success": True,
        "id": uid,
        "unesco_id": uid,
        "name": site.get("name"),
        "description": description,
        "country": site.get("country"),
        "category": site.get("category"),
        "latitude": site.get("latitude"),
        "longitude": site.get("longitude"),
        "image_url": site.get("image_url"),
        "year_inscribed": site.get("year_inscribed"),
    }


def _cache_closest(lat: float, lng: float) -> Optional[dict]:
    sites = get_cached_sites()
    if not sites:
        return None
    best = None
    best_dist = None
    for s in sites:
        slat, slng = s.get("latitude"), s.get("longitude")
        if slat is None or slng is None:
            continue
        d = haversine_km(lat, lng, slat, slng) * 1000
        if best_dist is None or d < best_dist:
            best = s
            best_dist = d
    if not best:
        return None
    return {
        "id": best.get("unesco_id"),
        "unesco_id": best.get("unesco_id"),
        "name": best["name"],
        "description": best.get("description"),
        "country": best.get("country"),
        "category": best.get("category"),
        "latitude": best.get("latitude"),
        "longitude": best.get("longitude"),
        "image_url": best.get("image_url"),
        "year_inscribed": best.get("year_inscribed"),
        "distance_m": best_dist,
    }


def site_to_response(site: WorldHeritageSite, distance_m: Optional[float] = None) -> dict:
    """
    Helper that converts a site into a dict for the response.
    Extracts the coordinates from the PostGIS POINT.
    """
    lat, lng = None, None
    if site.location is not None:
        # PostGIS returns a POINT - we extract lat/lng from it
        from geoalchemy2.shape import to_shape
        point = to_shape(site.location)
        lng = point.x
        lat = point.y

    return {
        "id": site.id,
        "unesco_id": site.unesco_id,
        "name": site.name,
        "description": site.description,
        "country": site.country,
        "category": site.category,
        "latitude": lat,
        "longitude": lng,
        "image_url": site.image_url,
        "year_inscribed": site.year_inscribed,
        "distance_m": distance_m,
    }


@router.get("/", response_model=List[SiteResponse])
def list_sites(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Hämtar en lista över alla världsarv.
    Returns the list of all World Heritage Sites.
    """
    sites = db.query(WorldHeritageSite).offset(skip).limit(limit).all()
    return [site_to_response(s) for s in sites]


@router.get("/nearby", response_model=List[SiteResponse])
def get_nearby_sites(
    lat: float = Query(..., ge=-90, le=90, description="Latitude"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude"),
    radius_km: float = Query(150, gt=0, le=500, description="Radius in kilometers"),
    db: Session = Depends(get_db)
):
    """
    Hämtar världsarv inom ett visst avstånd från en position.
    Returns sites near specific coordinates.

    Note: uses PostGIS to compute distance efficiently.
    """
    # Convert the radius from km to meters
    radius_m = radius_km * 1000

    # Build a PostGIS point from the coordinates
    user_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)

    # Query that returns sites within range, ordered by proximity
    results = db.query(
        WorldHeritageSite,
        ST_Distance(WorldHeritageSite.location, user_point).label("distance_m")
    ).filter(
        ST_Distance(WorldHeritageSite.location, user_point) <= radius_m
    ).order_by("distance_m").all()

    return [site_to_response(site, distance_m=float(dist)) for site, dist in results]


@router.get("/closest", response_model=SiteResponse)
def get_closest_site(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    db: Session = Depends(get_db)
):
    """
    Hämtar närmaste världsarv. Används av annonsen (ingen registrering krävs).
    """
    if settings.GEOFENCING_DEMO_MODE:
        return _demo_closest(lat, lng)

    try:
        user_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        result = db.query(
            WorldHeritageSite,
            ST_Distance(WorldHeritageSite.location, user_point).label("distance_m")
        ).order_by("distance_m").first()
        if result:
            site, distance = result
            return site_to_response(site, distance_m=float(distance))
    except Exception:
        pass

    cached = _cache_closest(lat, lng)
    if cached:
        return cached
    return _demo_closest(lat, lng)


@router.get("/public/{site_ref}")
def get_public_site(
    site_ref: str,
    lang: str = Query("sv", min_length=2, max_length=5),
):
    """
    Publik platsinfo för landningssidan (/sites/{unesco_id}) – ingen inloggning.
    """
    site = find_site_by_ref(site_ref)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return _public_site_payload(site, lang)


@router.get("/{site_id}", response_model=SiteResponse)
def get_site(site_id: int, db: Session = Depends(get_db)):
    """
    Hämtar detaljer om ett specifikt världsarv.
    Returns the details of a single site.
    """
    site = db.query(WorldHeritageSite).filter(WorldHeritageSite.id == site_id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site_to_response(site)


@router.post("/", response_model=SiteResponse, status_code=201)
def create_site(site_data: SiteCreate, db: Session = Depends(get_db)):
    """
    Skapar ett nytt världsarv (admin-endpoint).
    Adds a new site.
    """
    # Convert lat/lng into a PostGIS POINT
    location = f"POINT({site_data.longitude} {site_data.latitude})"

    new_site = WorldHeritageSite(
        unesco_id=site_data.unesco_id,
        name=site_data.name,
        description=site_data.description,
        country=site_data.country,
        category=site_data.category,
        location=location,
        image_url=site_data.image_url,
        year_inscribed=site_data.year_inscribed,
    )

    db.add(new_site)
    db.commit()
    db.refresh(new_site)

    return site_to_response(new_site)
