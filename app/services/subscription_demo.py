"""
Prenumeration utan PostgreSQL – för demo (GEOFENCING_DEMO_MODE).
"""
from datetime import date, timedelta
from decimal import Decimal

from fastapi import BackgroundTasks

from app.schemas import (
    SubscriptionCancelRequest,
    SubscriptionFlowCreateRequest,
    SubscriptionFlowResponse,
    SubscriptionPauseRequest,
)
import zlib

from app.services.auth_service import normalize_phone
from app.clients.remote_services import deliver_notification_message
from app.services.geofencing_demo import _demo_users, reset_demo_geofencing_user
from app.schemas import NotificationRequest
from app.services.receipt_service import send_subscription_receipt
from app.services.payment_service import process_payment

_demo_subscriptions: dict[str, dict] = {}


def _placeholder_phone_for_email(email: str) -> str:
    digest = zlib.crc32(email.lower().encode("utf-8")) % 10_000_000
    return f"+4670{digest:07d}"


def _confirmation_email(body: SubscriptionFlowCreateRequest, channel: str) -> str:
    return (body.email or (body.to if channel == "email" else "") or "").strip().lower()


def _phone_for_confirmation(body: SubscriptionFlowCreateRequest, channel: str, user_key: str) -> str:
    if channel == "sms":
        return user_key
    explicit = (body.phone or "").strip()
    if explicit:
        return normalize_phone(explicit)
    email = _confirmation_email(body, channel)
    return _placeholder_phone_for_email(email) if email else user_key


def _subscription_user_key(body: SubscriptionFlowCreateRequest) -> str:
    """Unik nyckel för demo – telefon eller e-post beroende på kanal."""
    channel = (body.channel or "sms").lower()
    if channel == "email":
        email = (body.email or body.to or "").strip().lower()
        if not email or "@" not in email:
            raise ValueError("email required for email subscription")
        return email

    phone = body.phone or body.to
    if not phone:
        raise ValueError("phone required for SMS subscription")
    return normalize_phone(phone)


def create_demo_subscription(
    body: SubscriptionFlowCreateRequest,
    background_tasks: BackgroundTasks | None = None,
) -> SubscriptionFlowResponse:
    user_key = _subscription_user_key(body)
    channel = (body.channel or "sms").lower()

    start = date.today()
    end = start + timedelta(days=body.duration_days or 30)
    user_id = user_key
    reset_demo_geofencing_user(user_key)

    account_phone = _phone_for_confirmation(body, channel, user_key)
    confirm_email = _confirmation_email(body, channel)

    _demo_users.setdefault(
        user_key,
        {
            "phone": account_phone,
            "email": confirm_email or (body.email or ""),
            "notification_channel": channel,
            "home_lat": None,
            "home_lng": None,
            "subscription_active": True,
            "notifications_paused": False,
            "preferred_language": body.language or "sv",
        },
    )
    _demo_users[user_key]["subscription_active"] = True
    _demo_users[user_key]["preferred_language"] = body.language or "sv"
    _demo_users[user_key]["notification_channel"] = channel
    _demo_users[user_key]["phone"] = account_phone
    if confirm_email:
        _demo_users[user_key]["email"] = confirm_email

    if channel == "sms" and background_tasks:
        confirmation = NotificationRequest(
            channel="sms",
            to=user_key,
            message=(
                "Din Heritage Connect-prenumeration är aktiv. "
                "Fullständig bekräftelse med OwnTracks-instruktioner skickas till din e-post."
                if confirm_email
                else "Din Heritage Connect-prenumeration är nu aktiv. "
                "Du får notiser om världsarv nära dig."
            ),
            user_id=user_key,
        )
        background_tasks.add_task(deliver_notification_message, confirmation)

    _demo_subscriptions[user_key] = {
        "subscription_id": 1,
        "subscription_active": True,
        "end_date": str(end),
    }

    payment_id = None
    if body.payment_intent_id or (body.amount and body.card_type and body.card_number):
        amount = Decimal(str(body.amount or 0))
        try:
            ok, tx_id = process_payment(
                amount,
                body.card_type or "visa",
                body.card_number or "",
                payment_intent_id=body.payment_intent_id,
            )
        except ValueError as exc:
            raise exc
        if not ok:
            raise ValueError("Payment failed or not completed")
        payment_id = 1 if tx_id else None

    if confirm_email and "@" in confirm_email and background_tasks:
        background_tasks.add_task(
            send_subscription_receipt,
            confirm_email,
            account_phone,
            str(end),
            body.language or "sv",
            user_id,
            notification_channel=channel,
        )

    return SubscriptionFlowResponse(
        success=True,
        user_id=user_id,
        subscription_id=1,
        subscription_active=True,
        payment_id=payment_id,
        end_date=str(end),
        receipt_sent=bool(confirm_email and "@" in confirm_email),
    )


def pause_demo_subscription(body: SubscriptionPauseRequest) -> dict:
    key = body.phone or body.user_id
    if key and key in _demo_users:
        _demo_users[key]["notifications_paused"] = body.paused
    return {
        "success": True,
        "user_id": key or "demo",
        "notifications_paused": body.paused,
        "demo_mode": True,
    }


def cancel_demo_subscription(body: SubscriptionCancelRequest) -> dict:
    key = body.to or body.user_id
    if key and key in _demo_users:
        _demo_users[key]["subscription_active"] = False
    if key and key in _demo_subscriptions:
        _demo_subscriptions[key]["subscription_active"] = False
    return {
        "success": True,
        "subscription_active": False,
        "user_id": key or "demo",
        "demo_mode": True,
    }
