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
from app.services.auth_service import normalize_phone
from app.services.geofencing_demo import _demo_users
from app.services.receipt_service import send_subscription_receipt
from app.services.payment_service import process_payment

_demo_subscriptions: dict[str, dict] = {}


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

    _demo_users.setdefault(
        user_key,
        {
            "phone": user_key if channel == "sms" else (body.phone or ""),
            "email": (body.email or body.to if channel == "email" else body.email or ""),
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
    if channel == "sms":
        _demo_users[user_key]["phone"] = user_key

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

    receipt_email = (body.email or (body.to if channel == "email" else None) or "").strip()
    if receipt_email and "@" in receipt_email and background_tasks:
        contact_for_receipt = body.phone or user_key
        background_tasks.add_task(
            send_subscription_receipt,
            receipt_email,
            contact_for_receipt,
            str(end),
            body.language or "sv",
            user_id,
        )

    return SubscriptionFlowResponse(
        success=True,
        user_id=user_id,
        subscription_id=1,
        subscription_active=True,
        payment_id=payment_id,
        end_date=str(end),
        receipt_sent=bool(receipt_email and "@" in receipt_email),
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
