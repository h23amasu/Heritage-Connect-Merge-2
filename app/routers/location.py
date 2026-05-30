"""
Router: Location updates from MAUI / mobile clients.

POST /api/location/update
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.phone_policy import is_blocked_phone
from app.core.database import get_db
from app.schemas import LocationUpdateRequest, LocationUpdateResponse
from app.services.geofencing_service import process_location_update
from app.services.geofencing_demo import process_location_demo
import re

router = APIRouter(prefix="/api/location", tags=["Location"])

_PHONE_RE = re.compile(r"^\+[1-9]\d{7,14}$")


def _normalize_phone(phone: str) -> str:
    cleaned = phone.replace(" ", "").replace("-", "")
    if cleaned.startswith("0") and len(cleaned) >= 9:
        cleaned = "+46" + cleaned[1:]
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    return cleaned


@router.post("/update", response_model=LocationUpdateResponse)
def update_location(
    body: LocationUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Tar emot plats från mobilappen (t.ex. 1 gång/timme).
    Uppdaterar användarens position och kör geofencing-logik.
    """
    phone = _normalize_phone(body.phoneNo)
    if is_blocked_phone(phone) or is_blocked_phone(body.phoneNo):
        raise HTTPException(status_code=400, detail="invalid_phone")
    if not _PHONE_RE.match(phone):
        raise HTTPException(status_code=400, detail="invalid_phone")

    if settings.GEOFENCING_DEMO_MODE:
        result = process_location_demo(
            phone,
            body.latitude,
            body.longitude,
            home_radius_km=settings.DEFAULT_HOME_RADIUS_KM,
            site_radius_km=settings.SITE_NOTIFY_RADIUS_KM,
            simulate_travel=body.simulate_travel,
        )
        return LocationUpdateResponse(**result)

    try:
        result = process_location_update(
            db,
            phone_number=phone,
            latitude=body.latitude,
            longitude=body.longitude,
        )
        return LocationUpdateResponse(**result)
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="database_unavailable",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail="server_error") from exc
