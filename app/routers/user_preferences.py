"""
Router: Användarinställningar – pausa, hemradie, besökta platser, notiskanal.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.payment import UserVisitedSite
from app.models.user import User
from app.schemas import UserPreferencesRequest, UserPreferencesResponse
from app.services.geofencing_demo import _demo_users, clear_demo_site_notified, mark_demo_site_notified
from app.services.auth_service import normalize_phone

router = APIRouter(prefix="/api/user", tags=["User preferences"])


def _get_user(
    db: Session,
    user_id: Optional[str],
    phone: Optional[str],
    email: Optional[str] = None,
) -> Optional[User]:
    if user_id and str(user_id).isdigit():
        return db.query(User).filter(User.id == int(user_id)).first()
    if email:
        normalized = email.strip().lower()
        return db.query(User).filter(User.email == normalized).first()
    if phone:
        return db.query(User).filter(User.phone_number == phone).first()
    if user_id:
        user = db.query(User).filter(User.phone_number == str(user_id)).first()
        if user:
            return user
        if "@" in str(user_id):
            return db.query(User).filter(User.email == str(user_id).lower()).first()
    return None


@router.get("/preferences", response_model=UserPreferencesResponse)
def get_preferences(
    user_id: Optional[str] = None,
    phone: Optional[str] = None,
    db: Session = Depends(get_db),
):
    user = _get_user(db, user_id, phone, email=None)
    if user:
        return UserPreferencesResponse(
            success=True,
            user_id=str(user.id),
            phone=user.phone_number,
            email=user.email,
            preferred_language=user.preferred_language,
            notifications_paused=user.notifications_paused,
            home_radius_km=user.home_radius_km or 5.0,
            notification_channel=getattr(user, "notification_channel", None) or "sms",
        )

    key = phone or user_id
    if key and key in _demo_users:
        d = _demo_users[key]
        return UserPreferencesResponse(
            success=True,
            user_id=key,
            phone=key,
            notifications_paused=d.get("notifications_paused", False),
            home_radius_km=0.1,
            notification_channel="sms",
            demo_mode=True,
        )

    raise HTTPException(status_code=404, detail="User not found")


@router.patch("/preferences", response_model=UserPreferencesResponse)
def update_preferences(
    body: UserPreferencesRequest,
    db: Session = Depends(get_db),
):
    user = _get_user(db, body.user_id, body.phone, body.email)
    if user:
        if body.notifications_paused is not None:
            user.notifications_paused = body.notifications_paused
        if body.home_radius_km is not None:
            user.home_radius_km = body.home_radius_km
        if body.preferred_language:
            user.preferred_language = body.preferred_language
        if body.email and "@" in body.email:
            user.email = body.email.strip().lower()
        if body.new_phone:
            normalized = normalize_phone(body.new_phone)
            if normalized != user.phone_number:
                conflict = (
                    db.query(User)
                    .filter(User.phone_number == normalized, User.id != user.id)
                    .first()
                )
                if conflict:
                    raise HTTPException(status_code=409, detail="Phone number already registered")
                user.phone_number = normalized
        if body.notification_channel in ("sms", "email"):
            if hasattr(user, "notification_channel"):
                user.notification_channel = body.notification_channel
        if body.visited is not None and body.site_id:
            site_id = int(body.site_id) if str(body.site_id).isdigit() else None
            if site_id and body.visited:
                exists = (
                    db.query(UserVisitedSite)
                    .filter(
                        UserVisitedSite.user_id == user.id,
                        UserVisitedSite.site_id == site_id,
                    )
                    .first()
                )
                if not exists:
                    db.add(UserVisitedSite(user_id=user.id, site_id=site_id))
            elif site_id and not body.visited:
                db.query(UserVisitedSite).filter(
                    UserVisitedSite.user_id == user.id,
                    UserVisitedSite.site_id == site_id,
                ).delete()
        db.commit()
        db.refresh(user)
        return get_preferences(user_id=str(user.id), db=db)

    key = body.phone or body.email or body.user_id
    if key:
        if key not in _demo_users:
            _demo_users[key] = {
                "phone": body.phone or "",
                "email": body.email or "",
                "notifications_paused": False,
                "notification_channel": "sms",
            }
        d = _demo_users[key]
        if body.notifications_paused is not None:
            d["notifications_paused"] = body.notifications_paused
        if body.notification_channel in ("sms", "email"):
            d["notification_channel"] = body.notification_channel
        if body.email:
            d["email"] = body.email.strip().lower()
        if body.new_phone:
            d["phone"] = normalize_phone(body.new_phone)
        elif body.phone:
            d["phone"] = normalize_phone(body.phone)
        if body.visited is not None and body.site_id:
            notify_user = d.get("phone") or key
            if notify_user and "@" not in str(notify_user):
                notify_user = normalize_phone(str(notify_user))
            if body.visited:
                mark_demo_site_notified(notify_user, str(body.site_id))
            else:
                clear_demo_site_notified(notify_user, str(body.site_id))
        return UserPreferencesResponse(
            success=True,
            user_id=key,
            phone=d.get("phone") or key,
            email=d.get("email") or None,
            notifications_paused=d.get("notifications_paused", False),
            notification_channel=d.get("notification_channel", "sms"),
            demo_mode=True,
        )

    raise HTTPException(status_code=404, detail="User not found")
