"""
Router: Payments
Handles payments (Mastercard/Visa).
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.payment import Payment
from app.schemas import PaymentCreate, PaymentResponse
from app.services.payment_service import process_payment

router = APIRouter(prefix="/api/payments", tags=["Payments"])


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
