"""
Model: Subscription
Represents a user's subscription to the SMS service.
Important: auto_renew is always False per the client's requirement.
"""
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="active")  # active, expired, cancelled

    # Critical: always False per Joakim's strict requirement
    # "The subscription must not auto-renew"
    auto_renew = Column(Boolean, default=False, nullable=False)

    reminder_sent = Column(Boolean, default=False)  # Have we sent a reminder?

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="subscriptions")
