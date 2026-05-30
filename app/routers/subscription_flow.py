"""
Router: Prenumerationsflöde (frontend-vägar /api/subscription/*).
Kombinerar registrering, betalning och prenumeration.
"""
import zlib
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.payment import Payment
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas import (
    SubscriptionCancelRequest,
    SubscriptionFlowCreateRequest,
    SubscriptionFlowResponse,
    SubscriptionPauseRequest,
)
from app.services.payment_service import process_payment
from app.services.receipt_service import send_subscription_receipt
from app.services.subscription_demo import (
    cancel_demo_subscription,
    create_demo_subscription,
    pause_demo_subscription,
)

router = APIRouter(prefix="/api/subscription", tags=["Subscription flow"])


def _placeholder_phone_for_email(email: str) -> str:
    """users.phone_number är obligatoriskt – syntetiskt nummer för ren e-postprenumeration."""
    digest = zlib.crc32(email.lower().encode("utf-8")) % 10_000_000
    return f"+4670{digest:07d}"


@router.post("/create", response_model=SubscriptionFlowResponse)
def create_subscription_flow(
    body: SubscriptionFlowCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Skapar användare + prenumeration (+ valfri kortbetalning).
    auto_renew är alltid false.
    """
    channel = (body.channel or "sms").lower()
    email_addr = (body.email or (body.to if channel == "email" else "") or "").strip().lower()

    phone = body.phone or (body.to if channel == "sms" else None)
    if not phone and channel == "sms":
        phone = body.to

    if channel == "sms" and not phone:
        raise HTTPException(status_code=400, detail="phone required for SMS subscription")
    if channel == "email" and (not email_addr or "@" not in email_addr):
        raise HTTPException(status_code=400, detail="email required for email subscription")

    if settings.GEOFENCING_DEMO_MODE:
        try:
            return create_demo_subscription(body, background_tasks)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        user = None
        if channel == "email":
            user = db.query(User).filter(User.email == email_addr).first()
        elif phone:
            user = db.query(User).filter(User.phone_number == phone).first()

        if not user:
            user_phone = phone or _placeholder_phone_for_email(email_addr)
            user = User(
                phone_number=user_phone,
                email=email_addr if channel == "email" else body.email,
                preferred_language=body.language or "sv",
            )
            if hasattr(user, "notification_channel"):
                user.notification_channel = channel
            db.add(user)
            db.flush()

        start = date.today()
        end = start + timedelta(days=body.duration_days or 30)
        sub = Subscription(
            user_id=user.id,
            start_date=start,
            end_date=end,
            status="active",
            auto_renew=False,
        )
        db.add(sub)
        db.flush()

        payment_id = None
        if body.payment_intent_id or (body.amount and body.card_type and body.card_number):
            ok, tx_id = process_payment(
                Decimal(str(body.amount or 0)),
                body.card_type or "visa",
                body.card_number or "",
                payment_intent_id=body.payment_intent_id,
            )
            if not ok:
                raise HTTPException(status_code=400, detail="Payment failed")
            pay = Payment(
                user_id=user.id,
                subscription_id=sub.id,
                amount=Decimal(str(body.amount or 0)),
                currency="SEK",
                card_type=body.card_type or "stripe",
                status="completed",
                transaction_id=tx_id,
            )
            db.add(pay)
            db.flush()
            payment_id = pay.id

        db.commit()

        receipt_email = email_addr if channel == "email" else (str(body.email) if body.email else "")
        if receipt_email and "@" in receipt_email:
            background_tasks.add_task(
                send_subscription_receipt,
                receipt_email,
                user.phone_number,
                str(end),
                body.language or user.preferred_language or "sv",
                str(user.id),
            )

        return SubscriptionFlowResponse(
            success=True,
            user_id=str(user.id),
            subscription_active=True,
            subscription_id=sub.id,
            payment_id=payment_id,
            end_date=str(end),
            receipt_sent=bool(receipt_email and "@" in receipt_email),
        )
    except SQLAlchemyError:
        return create_demo_subscription(body, background_tasks)


def _resolve_user(db: Session, user_id: str | None, phone: str | None):
    if user_id and str(user_id).isdigit():
        return db.query(User).filter(User.id == int(user_id)).first()
    if user_id:
        return db.query(User).filter(User.phone_number == user_id).first()
    if phone:
        return db.query(User).filter(User.phone_number == phone).first()
    return None


@router.post("/pause")
def pause_subscription_flow(
    body: SubscriptionPauseRequest,
    db: Session = Depends(get_db),
):
    if settings.GEOFENCING_DEMO_MODE:
        return pause_demo_subscription(body)

    user = _resolve_user(db, body.user_id, body.phone)
    if not user:
        return pause_demo_subscription(body)

    user.notifications_paused = body.paused
    db.commit()
    return {
        "success": True,
        "user_id": str(user.id),
        "notifications_paused": user.notifications_paused,
    }


@router.post("/cancel")
def cancel_subscription_flow(
    body: SubscriptionCancelRequest,
    db: Session = Depends(get_db),
):
    if settings.GEOFENCING_DEMO_MODE:
        return cancel_demo_subscription(body)

    user = _resolve_user(db, body.user_id, body.to if body.channel == "sms" else None)

    if user:
        subs = (
            db.query(Subscription)
            .filter(Subscription.user_id == user.id, Subscription.status == "active")
            .all()
        )
        for s in subs:
            s.status = "cancelled"
        db.commit()
        return {"success": True, "subscription_active": False, "user_id": str(user.id)}

    return cancel_demo_subscription(body)
