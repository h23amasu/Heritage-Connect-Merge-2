"""
Router: Payments
Handles payments (Mastercard/Visa).
"""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.payment import Payment
from app.schemas import PaymentCreate, PaymentIntentCreate, PaymentIntentResponse, PaymentResponse
from app.services.payment_service import (
    create_stripe_payment_intent,
    process_payment,
    stripe_configured,
)

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.get("/config")
def payment_config():
    """Publikt betalningsläge för frontend (ingen hemlig nyckel)."""
    from app.core.config import settings

    provider = (settings.PAYMENT_PROVIDER or "mock").lower()
    secret = settings.STRIPE_SECRET_KEY or ""
    publishable = settings.STRIPE_PUBLISHABLE_KEY or ""
    stripe_enabled = provider == "stripe" and bool(secret)
    return {
        "success": True,
        "provider": provider,
        "stripe_enabled": stripe_enabled,
        "stripe_sandbox": secret.startswith("sk_test_"),
        "stripe_publishable_key": publishable if stripe_enabled else None,
    }


@router.post("/intent", response_model=PaymentIntentResponse)
def create_payment_intent(body: PaymentIntentCreate):
    """Skapar Stripe PaymentIntent för Payment Element (test/live enligt nyckel)."""
    from app.core.config import settings

    if not stripe_configured():
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured. Set PAYMENT_PROVIDER=stripe and STRIPE_SECRET_KEY.",
        )
    if not settings.STRIPE_PUBLISHABLE_KEY:
        raise HTTPException(
            status_code=503,
            detail="STRIPE_PUBLISHABLE_KEY is required for Stripe checkout.",
        )

    try:
        metadata = {}
        if body.site_id:
            metadata["site_id"] = body.site_id
        if body.site_name:
            metadata["site_name"] = body.site_name[:200]
        client_secret, payment_intent_id = create_stripe_payment_intent(
            Decimal(str(body.amount)),
            metadata=metadata,
        )
        return PaymentIntentResponse(
            client_secret=client_secret,
            payment_intent_id=payment_intent_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc}") from exc


@router.post("/", response_model=PaymentResponse, status_code=201)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    """
    Initierar en betalning.
    Processes a new payment.
    """
    # Process the payment through the payment service
    success, transaction_id = process_payment(
        amount=data.amount,
        card_type=data.card_type,
        card_number=data.card_number,
    )

    if not success:
        raise HTTPException(status_code=400, detail="Payment failed")

    # Save the payment to the database
    new_payment = Payment(
        user_id=data.user_id,
        subscription_id=data.subscription_id,
        amount=data.amount,
        currency="SEK",
        card_type=data.card_type,
        status="completed",
        transaction_id=transaction_id,
    )
    db.add(new_payment)
    db.commit()
    db.refresh(new_payment)
    return new_payment


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    """Returns the details of a specific payment."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment
