"""
Model: User
Represents a subscriber to the SMS service.
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255))
    preferred_language = Column(String(10), default="sv")  # sv, en, etc.

    # Geofencing – home zone suppresses commute notifications
    home_latitude = Column(Float, nullable=True)
    home_longitude = Column(Float, nullable=True)
    home_radius_km = Column(Float, default=5.0)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    notifications_paused = Column(Boolean, default=False, nullable=False)
    notification_channel = Column(String(10), default="sms")  # sms | email

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships with related tables
    subscriptions = relationship("Subscription", back_populates="user")
    visited_sites = relationship("UserVisitedSite", back_populates="user")
