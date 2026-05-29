"""
Router: Subscriptions
Handles SMS subscriptions.

Note: per the client's requirement subscriptions never auto-renew.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas import SubscriptionCreate, SubscriptionResponse

router = APIRouter(prefix="/api/subscriptions", tags=["Subscriptions"])


@router.post("/", response_model=SubscriptionResponse, status_code=201)
def create_subscription(
    data: SubscriptionCreate,
    db: Session = Depends(get_db)
):
    """
    Skapar en ny prenumeration.
    Creates a new subscription. auto_renew is always False.
    """
    # Make sure the user exists
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    start = date.today()
    end = start + timedelta(days=data.duration_days)

    new_sub = Subscription(
        user_id=data.user_id,
        start_date=start,
        end_date=end,
        status="active",
        auto_renew=False,  # Critical: always False
        reminder_sent=False,
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
def get_subscription(subscription_id: int, db: Session = Depends(get_db)):
    """Returns a specific subscription."""
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return sub


@router.post("/{subscription_id}/renew", response_model=SubscriptionResponse)
def renew_subscription(
    subscription_id: int,
    duration_days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Manuell förnyelse av prenumeration.
    Manual subscription renewal. The user must choose to renew (it never happens automatically).
    """
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Extend the end date
    sub.end_date = date.today() + timedelta(days=duration_days)
    sub.status = "active"
    sub.reminder_sent = False

    db.commit()
    db.refresh(sub)
    return sub


@router.delete("/{subscription_id}", status_code=204)
def cancel_subscription(subscription_id: int, db: Session = Depends(get_db)):
    """
    Avsluta prenumeration.
    Cancel the subscription.
    """
    sub = db.query(Subscription).filter(Subscription.id == subscription_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")

    sub.status = "cancelled"
    db.commit()
    return None
