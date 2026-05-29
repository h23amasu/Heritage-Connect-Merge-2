"""
Models: Payment and UserVisitedSite (visited sites)
"""
from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))

    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="SEK")
    card_type = Column(String(20))  # mastercard or visa per the client's requirement
    status = Column(String(20), default="pending")  # pending, completed, failed
    transaction_id = Column(String(255))

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserVisitedSite(Base):
    """
    Important table: prevents sending the same notification twice to the same user.
    Per the client's requirement: "Don't spam users about sites they have already visited."
    """
    __tablename__ = "user_visited_sites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    site_id = Column(Integer, ForeignKey("world_heritage_sites.id"))
    notified_at = Column(DateTime(timezone=True), server_default=func.now())

    # UNIQUE constraint guarantees a user is not notified twice about the same site
    __table_args__ = (
        UniqueConstraint("user_id", "site_id", name="unique_user_site"),
    )

    user = relationship("User", back_populates="visited_sites")
