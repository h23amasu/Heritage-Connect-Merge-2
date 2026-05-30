"""
Geofencing – avoid commute-zone notifications, notify near heritage sites on travel.
"""
import math
from datetime import date
from typing import Any, Optional

from sqlalchemy.orm import Session
from geoalchemy2.functions import ST_Distance, ST_MakePoint, ST_SetSRID
from geoalchemy2.shape import to_shape

from app.core.config import settings
from app.models.user import User
from app.models.site import WorldHeritageSite
from app.models.subscription import Subscription
from app.models.payment import UserVisitedSite
from app.schemas import NotificationRequest
from app.services.message_builder import build_near_site_sms
from app.services.notification_service import (
    check_cooldown,
    dispatch_notification,
    record_cooldown,
)


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _site_coords(site: WorldHeritageSite) -> Optional[tuple[float, float]]:
    if site.location is None:
        return None
    try:
        point = to_shape(site.location)
        return point.y, point.x  # lat, lng
    except Exception:
        return None


def _find_nearby_sites_postgis(
    db: Session, lat: float, lng: float, radius_km: float
) -> list[tuple[WorldHeritageSite, float]]:
    radius_m = radius_km * 1000
    user_point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    results = (
        db.query(
            WorldHeritageSite,
            ST_Distance(WorldHeritageSite.location, user_point).label("distance_m"),
        )
        .filter(WorldHeritageSite.location.isnot(None))
        .filter(ST_Distance(WorldHeritageSite.location, user_point) <= radius_m)
        .order_by("distance_m")
        .all()
    )
    return [(site, float(dist)) for site, dist in results]


def _find_nearby_sites_haversine(
    db: Session, lat: float, lng: float, radius_km: float
) -> list[tuple[WorldHeritageSite, float]]:
    sites = db.query(WorldHeritageSite).all()
    nearby: list[tuple[WorldHeritageSite, float]] = []
    for site in sites:
        coords = _site_coords(site)
        if not coords:
            continue
        slat, slng = coords
        dist_km = haversine_km(lat, lng, slat, slng)
        if dist_km <= radius_km:
            nearby.append((site, dist_km * 1000))
    nearby.sort(key=lambda x: x[1])
    return nearby


def find_nearby_sites(
    db: Session, lat: float, lng: float, radius_km: float
) -> list[tuple[WorldHeritageSite, float]]:
    try:
        return _find_nearby_sites_postgis(db, lat, lng, radius_km)
    except Exception:
        return _find_nearby_sites_haversine(db, lat, lng, radius_km)


def get_or_create_user(db: Session, phone_number: str) -> User:
    normalized = phone_number.replace(" ", "")
    user = db.query(User).filter(User.phone_number == normalized).first()
    if user:
        return user
    user = User(phone_number=normalized, preferred_language="sv")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def has_active_subscription(db: Session, user_id: int) -> bool:
    today = date.today()
    sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id,
            Subscription.status == "active",
            Subscription.end_date >= today,
        )
        .first()
    )
    return sub is not None


def already_notified(db: Session, user_id: int, site_id: int) -> bool:
    return (
        db.query(UserVisitedSite)
        .filter(
            UserVisitedSite.user_id == user_id,
            UserVisitedSite.site_id == site_id,
        )
        .first()
        is not None
    )


def is_outside_commute_zone(user: User, lat: float, lng: float) -> bool:
    """True when user is far enough from home to count as traveling."""
    if user.home_latitude is None or user.home_longitude is None:
        return True
    dist_km = haversine_km(
        lat, lng, user.home_latitude, user.home_longitude
    )
    return dist_km > (user.home_radius_km or settings.DEFAULT_HOME_RADIUS_KM)


def process_location_update(
    db: Session,
    phone_number: str,
    latitude: float,
    longitude: float,
) -> dict[str, Any]:
    """
    MAUI app sends position ~1/hour. Updates user state and may trigger SMS.
    """
    user = get_or_create_user(db, phone_number)

    # First position becomes "home" if not configured
    if user.home_latitude is None:
        user.home_latitude = latitude
        user.home_longitude = longitude

    user.last_latitude = latitude
    user.last_longitude = longitude
    db.commit()

    result: dict[str, Any] = {
        "success": True,
        "user_id": str(user.id),
        "notified": False,
        "in_commute_zone": not is_outside_commute_zone(user, latitude, longitude),
        "nearest_site": None,
        "notification": None,
    }

    if user.notifications_paused:
        result["reason"] = "notifications_paused"
        return result

    if not has_active_subscription(db, user.id):
        result["reason"] = "no_active_subscription"
        return result

    if result["in_commute_zone"]:
        result["reason"] = "in_commute_zone"
        return result

    nearby = find_nearby_sites(
        db, latitude, longitude, settings.SITE_NOTIFY_RADIUS_KM
    )
    if not nearby:
        result["reason"] = "no_nearby_site"
        return result

    site, distance_m = nearby[0]
    result["nearest_site"] = {
        "id": site.id,
        "name": site.name,
        "distance_km": round(distance_m / 1000, 2),
    }

    if already_notified(db, user.id, site.id):
        result["reason"] = "already_notified"
        return result

    lang = user.preferred_language or "sv"
    unesco_id = getattr(site, "unesco_id", None)
    message = build_near_site_sms(
        site.name,
        site.id,
        lang,
        unesco_id=str(unesco_id) if unesco_id else None,
    )
    notification = NotificationRequest(
        type="sms",
        to=user.phone_number,
        message=message,
        user_id=str(user.id),
        site_id=str(site.id),
    )

    if check_cooldown(notification):
        result["reason"] = "cooldown"
        return result

    if not dispatch_notification(notification):
        result["reason"] = "sms_delivery_failed"
        return result

    record_cooldown(notification)

    visited = UserVisitedSite(user_id=user.id, site_id=site.id)
    db.add(visited)
    db.commit()

    result["notified"] = True
    result["notification"] = {"channel": "sms", "site_id": site.id}
    return result
