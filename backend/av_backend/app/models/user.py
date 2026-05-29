"""
Model: User
Represents a subscriber to the SMS service.
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255))
    preferred_language = Column(String(10), default="sv")  # sv, en, etc.

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships with related tables
    subscriptions = relationship("Subscription", back_populates="user")
    visited_sites = relationship("UserVisitedSite", back_populates="user")
