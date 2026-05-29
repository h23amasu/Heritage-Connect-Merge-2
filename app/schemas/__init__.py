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


# ========== Notifications (shared course API) ==========

class NotificationRequest(BaseModel):
    type: str = Field(..., description='sms or email')
    to: str
    message: str = Field(..., min_length=1, max_length=2000)
    subject: Optional[str] = None
    user_id: Optional[str] = None
    site_id: Optional[str] = None


class NotificationSuccessResponse(BaseModel):
    success: bool = True
    channel: str


class NotificationErrorResponse(BaseModel):
    success: bool = False
    error: str


# ========== Location (MAUI app) ==========

class LocationUpdateRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    phoneNo: str = Field(..., min_length=8, max_length=20)
    timestamp: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class LocationUpdateResponse(BaseModel):
    success: bool
    user_id: Optional[str] = None
    notified: bool = False
    in_commute_zone: bool = False
    nearest_site: Optional[dict] = None
    reason: Optional[str] = None
    notification: Optional[dict] = None
    demo_mode: Optional[bool] = None


# ========== SMS (legacy internal) ==========

class SMSRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{7,14}$")
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
    language: str = "sv"


class AIAnswer(BaseModel):
    answer: str
    sources: list[str]
    needs_followup: bool = False


# ========== Newspapers ==========

class NewspaperResponse(BaseModel):
    id: int
    name: str
    language: str
    primary_color: str
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True


# ========== Translation ==========

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_language: str = Field(..., min_length=2, max_length=5)
    target_language: str = Field(..., min_length=2, max_length=5)


class TranslateResponse(BaseModel):
    success: bool = True
    source_language: str
    target_language: str
    original_text: str
    translated_text: str


class TranslateBatchRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=80)
    source_language: str = Field(..., min_length=2, max_length=5)
    target_language: str = Field(..., min_length=2, max_length=5)


class TranslateBatchResponse(BaseModel):
    success: bool = True
    source_language: str
    target_language: str
    translations: list[str]


# ========== Auth ==========

class AuthRequestCodeRequest(BaseModel):
    phone: str = Field(..., min_length=8, max_length=20)
    purpose: Optional[str] = "login"


class AuthVerifyCodeRequest(BaseModel):
    phone: str
    code: str = Field(..., min_length=4, max_length=8)


class AuthRequestEmailCodeRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "login"


class AuthVerifyEmailCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=8)


class BankIdCompleteRequest(BaseModel):
    order_ref: str


class AuthTokenResponse(BaseModel):
    success: bool = True
    access_token: str
    user_id: str
    method: str


# ========== User preferences ==========

class UserPreferencesRequest(BaseModel):
    user_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    notification_channel: Optional[str] = None
    notifications_paused: Optional[bool] = None
    home_radius_km: Optional[float] = Field(None, gt=0, le=500)
    preferred_language: Optional[str] = None
    site_id: Optional[str] = None
    visited: Optional[bool] = None


class UserPreferencesResponse(BaseModel):
    success: bool = True
    user_id: str
    phone: Optional[str] = None
    preferred_language: Optional[str] = "sv"
    notifications_paused: bool = False
    home_radius_km: float = 5.0
    notification_channel: str = "sms"
    demo_mode: Optional[bool] = None


# ========== Subscription flow (frontend) ==========

class SubscriptionFlowCreateRequest(BaseModel):
    channel: str = "sms"
    to: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    site_id: Optional[str] = None
    site_name: Optional[str] = None
    language: str = "sv"
    subscription_type: Optional[str] = None
    duration_days: int = Field(default=30, ge=1, le=365)
    amount: Optional[float] = None
    card_type: Optional[str] = None
    card_number: Optional[str] = None


class SubscriptionFlowResponse(BaseModel):
    success: bool = True
    user_id: str
    subscription_id: int
    subscription_active: bool = True
    payment_id: Optional[int] = None
    end_date: Optional[str] = None
    receipt_sent: bool = False


class SubscriptionPauseRequest(BaseModel):
    user_id: Optional[str] = None
    phone: Optional[str] = None
    paused: bool = True


class SubscriptionCancelRequest(BaseModel):
    user_id: Optional[str] = None
    channel: Optional[str] = None
    to: Optional[str] = None
    subscription_active: Optional[bool] = False
