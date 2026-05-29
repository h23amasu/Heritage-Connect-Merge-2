"""
Pydantic schemas - used by FastAPI for automatic validation
of request bodies and responses.
"""
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# ========== World Heritage Sites ==========

class SiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    country: Optional[str] = None
    category: Optional[str] = None


class SiteCreate(SiteBase):
    unesco_id: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    image_url: Optional[str] = None
    year_inscribed: Optional[int] = None


class SiteResponse(SiteBase):
    id: int
    unesco_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    year_inscribed: Optional[int] = None
    distance_m: Optional[float] = None

    class Config:
        from_attributes = True


# ========== Users ==========

class UserBase(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{7,15}$")
    email: Optional[EmailStr] = None
    preferred_language: str = "sv"


class UserCreate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ========== Subscriptions ==========

class SubscriptionCreate(BaseModel):
    user_id: int
    duration_days: int = Field(default=30, ge=1, le=365)


class SubscriptionResponse(BaseModel):
    id: int
    user_id: int
    start_date: date
    end_date: date
    status: str
    auto_renew: bool
    reminder_sent: bool

    class Config:
        from_attributes = True


# ========== Payments ==========

class PaymentCreate(BaseModel):
    user_id: int
    subscription_id: int
    amount: Decimal = Field(..., gt=0)
    card_type: str = Field(..., pattern=r"^(mastercard|visa)$")
    card_number: str


class PaymentResponse(BaseModel):
    id: int
    amount: Decimal
    currency: str
    status: str
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ========== SMS ==========
# Critical: this schema must be standardized across all groups
# so the module can be swapped out for the final demo.

class SMSRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[0-9]{7,15}$")
    message: str = Field(..., max_length=160)
    site_id: Optional[int] = None


class SMSResponse(BaseModel):
    status: str  # sent, failed, pending
    message_id: str
    timestamp: datetime


# ========== AI ==========

class AIQuestion(BaseModel):
    user_id: Optional[int] = None
    site_id: int
    question: str = Field(..., min_length=3, max_length=500)


class AIAnswer(BaseModel):
    answer: str
    sources: list[str]


# ========== Newspapers ==========

class NewspaperResponse(BaseModel):
    id: int
    name: str
    language: str
    primary_color: str
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True
