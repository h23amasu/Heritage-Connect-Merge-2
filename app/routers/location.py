"""
Router: Location updates from MAUI / mobile clients and OwnTracks HTTP.

POST /api/location/update
POST /api/location/owntracks
"""
from __future__ import annotations

import base64
import json
import logging
import re
import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.phone_policy import is_blocked_phone
from app.schemas import LocationUpdateRequest, LocationUpdateResponse
from app.services.geofencing_demo import process_location_demo
from app.services.geofencing_service import process_location_update

router = APIRouter(prefix="/api/location", tags=["Location"])
logger = logging.getLogger(__name__)

_PHONE_RE = re.compile(r"^\+[1-9]\d{7,14}$")


def _normalize_phone(phone: str) -> str:
    cleaned = phone.replace(" ", "").replace("-", "")
    if cleaned.startswith("0") and len(cleaned) >= 9:
        cleaned = "+46" + cleaned[1:]
    if not cleaned.startswith("+"):
        cleaned = "+" + cleaned
    return cleaned


def _validate_phone(phone: str) -> str:
    normalized = _normalize_phone(phone)
    if is_blocked_phone(phone) or is_blocked_phone(normalized):
        raise HTTPException(status_code=400, detail="invalid_phone")
    if not _PHONE_RE.match(normalized):
        raise HTTPException(status_code=400, detail="invalid_phone")
    return normalized


def _run_geofencing(
    db: Session,
    phone: str,
    latitude: float,
    longitude: float,
    *,
    simulate_travel: bool = False,
) -> dict[str, Any]:
    if settings.GEOFENCING_DEMO_MODE:
        return process_location_demo(
            phone,
            latitude,
            longitude,
            home_radius_km=settings.DEFAULT_HOME_RADIUS_KM,
            site_radius_km=settings.SITE_NOTIFY_RADIUS_KM,
            simulate_travel=simulate_travel,
        )

    try:
        return process_location_update(
            db,
            phone_number=phone,
            latitude=latitude,
            longitude=longitude,
        )
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="database_unavailable") from None
    except Exception as exc:
        raise HTTPException(status_code=500, detail="server_error") from exc


def _verify_owntracks_http_auth(request: Request) -> None:
    expected_user = (settings.OWOTRACKS_HTTP_USER or "").strip()
    expected_pass = (settings.OWOTRACKS_HTTP_PASSWORD or "").strip()
    if not expected_user and not expected_pass:
        return

    header = request.headers.get("Authorization") or ""
    if not header.lower().startswith("basic "):
        raise HTTPException(status_code=401, detail="authentication_required")

    try:
        decoded = base64.b64decode(header.split(" ", 1)[1]).decode("utf-8")
        username, _, password = decoded.partition(":")
    except (ValueError, UnicodeDecodeError):
        raise HTTPException(status_code=401, detail="authentication_required") from None

    user_ok = secrets.compare_digest(username, expected_user)
    pass_ok = secrets.compare_digest(password, expected_pass)
    if not (user_ok and pass_ok):
        raise HTTPException(status_code=401, detail="authentication_required")


def _phone_from_owntracks_topic(topic: str) -> str | None:
    """owntracks/<user>/<device> – user ska vara telefonnummer i E.164."""
    parts = [part for part in topic.strip().split("/") if part]
    if len(parts) < 2:
        return None
    candidate = parts[1]
    try:
        return _validate_phone(candidate)
    except HTTPException:
        return None


def _resolve_owntracks_phone(request: Request, payload: dict[str, Any]) -> str | None:
    header_user = (request.headers.get("X-Limit-U") or "").strip()
    if header_user:
        try:
            return _validate_phone(header_user)
        except HTTPException:
            pass

    topic = payload.get("topic")
    if isinstance(topic, str) and topic:
        phone = _phone_from_owntracks_topic(topic)
        if phone:
            return phone

    query_user = (request.query_params.get("u") or "").strip()
    if query_user:
        try:
            return _validate_phone(query_user)
        except HTTPException:
            pass

    return None


@router.post("/update", response_model=LocationUpdateResponse)
def update_location(
    body: LocationUpdateRequest,
    db: Session = Depends(get_db),
):
    """
    Tar emot plats från mobilappen (t.ex. 1 gång/timme).
    Uppdaterar användarens position och kör geofencing-logik.
    """
    phone = _validate_phone(body.phoneNo)
    result = _run_geofencing(
        db,
        phone,
        body.latitude,
        body.longitude,
        simulate_travel=body.simulate_travel,
    )
    return LocationUpdateResponse(**result)


@router.post("/owntracks")
async def owntracks_location_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """
    OwnTracks HTTP-läge: appen POST:ar JSON med _type=location i bakgrunden.
    Returnerar [] enligt OwnTracks-spec (2xx = mottaget).
    """
    _verify_owntracks_http_auth(request)

    raw = await request.body()
    if not raw or not raw.strip():
        return JSONResponse(content=[])

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return JSONResponse(content=[])

    if not isinstance(payload, dict):
        return JSONResponse(content=[])

    if payload.get("_type") != "location":
        return JSONResponse(content=[])

    latitude = payload.get("lat")
    longitude = payload.get("lon")
    if latitude is None or longitude is None:
        return JSONResponse(content=[])

    phone = _resolve_owntracks_phone(request, payload)
    if not phone:
        logger.warning("OwnTracks location utan giltigt telefonnummer (X-Limit-U / topic)")
        raise HTTPException(
            status_code=400,
            detail="phone_required_set_X-Limit-U_to_subscription_phone",
        )

    result = _run_geofencing(
        db,
        phone,
        float(latitude),
        float(longitude),
        simulate_travel=False,
    )

    if result.get("notified"):
        logger.info(
            "OwnTracks geofencing SMS till %s nära %s",
            phone,
            (result.get("nearest_site") or {}).get("name"),
        )
    elif result.get("reason"):
        logger.debug("OwnTracks geofencing skip %s: %s", phone, result.get("reason"))

    return JSONResponse(content=[])
