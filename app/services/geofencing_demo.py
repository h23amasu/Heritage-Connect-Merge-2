"""
Demo-geofencing utan PostgreSQL – för lokala tester.
Aktiveras med GEOFENCING_DEMO_MODE=true i .env
"""
from __future__ import annotations

from typing import Any

from app.services.auth_service import normalize_phone
from app.services.geofencing_service import haversine_km
from app.services.heritage_sites_local import find_closest_site
from app.services.message_builder import build_near_site_sms
from app.services.notification_service import (
    dispatch_notification,
)
from app.services.cooldown_service import cooldown_service
from app.schemas import NotificationRequest

_demo_users: dict[str, dict[str, Any]] = {}
_demo_notified: set[tuple[str, str]] = set()


def _geo_cooldown_active(request: NotificationRequest) -> bool:
    return cooldown_service.is_on_cooldown(
        "geo",
        request.to,
        request.user_id,
        request.site_id,
    )


def _record_geo_cooldown(request: NotificationRequest) -> None:
    cooldown_service.record_send(
        "geo",
        request.to,
        request.user_id,
        request.site_id,
    )


def mark_demo_site_notified(user_key: str, site_id: str) -> None:
    _demo_notified.add((user_key, str(site_id)))


def clear_demo_site_notified(user_key: str, site_id: str) -> None:
    _demo_notified.discard((user_key, str(site_id)))


def _demo_user_key(phone_number: str) -> str:
    return normalize_phone(phone_number)


def reset_demo_geofencing_user(user_key: str) -> None:
    """Nollställ hem/notifieringar vid ny demo-prenumeration (för omtest)."""
    normalized = _demo_user_key(user_key)
    user = _demo_users.get(normalized)
    if user:
        user["home_lat"] = None
        user["home_lng"] = None
    stale = {(key, site_id) for key, site_id in _demo_notified if key == normalized}
    _demo_notified.difference_update(stale)
    cooldown_service.clear_geo_for_recipient(normalized)


def _ensure_demo_user(phone_number: str) -> dict[str, Any]:
    key = _demo_user_key(phone_number)
    if key not in _demo_users:
        _demo_users[key] = {
            "phone": key,
            "email": "",
            "home_lat": None,
            "home_lng": None,
            "subscription_active": True,
            "notifications_paused": False,
            "preferred_language": "sv",
            "notification_channel": "sms",
        }
    return _demo_users[key]


def process_location_demo(
    phone_number: str,
    latitude: float,
    longitude: float,
    *,
    home_radius_km: float = 0.1,
    site_radius_km: float = 30.0,
    simulate_travel: bool = False,
) -> dict[str, Any]:
    user_key = _demo_user_key(phone_number)
    user = _ensure_demo_user(phone_number)

    result: dict[str, Any] = {
        "success": True,
        "user_id": user_key,
        "notified": False,
        "in_commute_zone": False,
        "nearest_site": None,
        "reason": None,
        "notification": None,
        "demo_mode": True,
    }

    if user["notifications_paused"]:
        result["reason"] = "notifications_paused"
        return result

    if not user["subscription_active"]:
        result["reason"] = "no_active_subscription"
        return result

    channel = (user.get("notification_channel") or "sms").lower()
    if channel != "sms":
        result["reason"] = "notification_channel_not_sms"
        return result

    home_was_unset = user["home_lat"] is None
    if home_was_unset:
        user["home_lat"] = latitude
        user["home_lng"] = longitude
        if not simulate_travel:
            result["reason"] = "home_registered"
            return result

    if not simulate_travel:
        dist_home = haversine_km(
            latitude, longitude, user["home_lat"], user["home_lng"]
        )
        if dist_home <= home_radius_km:
            result["in_commute_zone"] = True
            result["reason"] = "in_commute_zone"
            return result

    nearest, nearest_dist_km = find_closest_site(latitude, longitude)
    if not nearest or nearest_dist_km > site_radius_km:
        result["reason"] = "no_nearby_site"
        return result

    unesco_id = str(nearest.get("unesco_id") or nearest.get("id") or "")
    site_name = nearest.get("name") or "UNESCO-världsarv"

    result["nearest_site"] = {
        "id": unesco_id,
        "unesco_id": unesco_id,
        "name": site_name,
        "distance_km": round(nearest_dist_km, 2),
    }

    notify_key = (user_key, unesco_id)
    if notify_key in _demo_notified:
        result["reason"] = "already_notified"
        return result

    lang = user.get("preferred_language") or "sv"
    notification = NotificationRequest(
        type="sms",
        to=user_key,
        message=build_near_site_sms(site_name, unesco_id, lang, unesco_id=unesco_id),
        user_id=user_key,
        site_id=unesco_id,
    )

    if _geo_cooldown_active(notification):
        result["reason"] = "cooldown"
        return result

    if not dispatch_notification(notification):
        result["reason"] = "sms_delivery_failed"
        return result

    _record_geo_cooldown(notification)
    _demo_notified.add(notify_key)

    result["notified"] = True
    result["notification"] = {"channel": "sms", "site_id": unesco_id}
    return result
