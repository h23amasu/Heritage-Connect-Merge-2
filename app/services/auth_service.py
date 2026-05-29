"""
Autentisering – SMS-engångskod och BankID (mock för utveckling).
"""
from __future__ import annotations

import random
import secrets
import time
from typing import Optional

from app.core.phone_policy import is_blocked_phone
from app.schemas import NotificationRequest
from app.services.notification_service import dispatch_notification

# phone -> {code, expires_at}
_otp_store: dict[str, dict] = {}
# email -> {code, expires_at}
_email_otp_store: dict[str, dict] = {}
# token -> phone
_session_store: dict[str, str] = {}

OTP_TTL_SECONDS = 300
DEV_OTP_CODE = "123456"


def normalize_phone(phone: str) -> str:
    p = phone.strip().replace(" ", "")
    if p.startswith("0") and len(p) >= 9:
        return "+46" + p[1:]
    if not p.startswith("+"):
        return "+" + p
    return p


def request_sms_code(phone: str) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Skickar OTP via gemensamma notification-API:t.
    Returnerar (ok, error_code, dev_code för test).
    """
    normalized = normalize_phone(phone)
    if is_blocked_phone(normalized) or is_blocked_phone(phone):
        return False, "invalid_recipient", None
    if not normalized.startswith("+") or len(normalized) < 10:
        return False, "invalid_recipient", None

    code = DEV_OTP_CODE if True else f"{random.randint(100000, 999999)}"
    _otp_store[normalized] = {
        "code": code,
        "expires_at": time.time() + OTP_TTL_SECONDS,
    }

    message = f"Din Heritage Connect-kod: {code}. Giltig i 5 min."
    notification = NotificationRequest(
        type="sms",
        to=normalized,
        message=message,
        user_id=normalized,
    )
    dispatch_notification(notification)
    return True, None, code


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def request_email_code(email: str) -> tuple[bool, Optional[str], Optional[str]]:
    """Skickar OTP via e-post (samma notification-API som kvitton)."""
    normalized = _normalize_email(email)
    if "@" not in normalized:
        return False, "invalid_recipient", None

    code = DEV_OTP_CODE
    _email_otp_store[normalized] = {
        "code": code,
        "expires_at": time.time() + OTP_TTL_SECONDS,
    }

    message = f"Din Heritage Connect-inloggningskod: {code}. Giltig i 5 min."
    notification = NotificationRequest(
        type="email",
        to=normalized,
        message=message,
        subject="Heritage Connect – inloggningskod",
        user_id=normalized,
    )
    dispatch_notification(notification)
    return True, None, code


def verify_email_code(email: str, code: str) -> tuple[bool, Optional[str], Optional[str]]:
    normalized = _normalize_email(email)
    entry = _email_otp_store.get(normalized)
    if not entry:
        return False, "no_code_requested", None
    if time.time() > entry["expires_at"]:
        del _email_otp_store[normalized]
        return False, "code_expired", None
    if code.strip() != entry["code"]:
        return False, "invalid_code", None

    del _email_otp_store[normalized]
    token = secrets.token_urlsafe(24)
    _session_store[token] = f"email:{normalized}"
    return True, None, token


def verify_sms_code(phone: str, code: str) -> tuple[bool, Optional[str], Optional[str]]:
    normalized = normalize_phone(phone)
    entry = _otp_store.get(normalized)
    if not entry:
        return False, "no_code_requested", None
    if time.time() > entry["expires_at"]:
        del _otp_store[normalized]
        return False, "code_expired", None
    if code.strip() != entry["code"]:
        return False, "invalid_code", None

    del _otp_store[normalized]
    token = secrets.token_urlsafe(24)
    _session_store[token] = normalized
    return True, None, token


def bankid_start() -> dict:
    """Mock BankID – returnerar orderRef för demo."""
    order_ref = secrets.token_hex(16)
    return {
        "success": True,
        "method": "bankid",
        "order_ref": order_ref,
        "auto_complete_token": secrets.token_urlsafe(16),
        "message": "BankID mock – anropa /api/auth/bankid/complete med order_ref",
    }


def bankid_complete(order_ref: str) -> tuple[bool, Optional[str], Optional[str]]:
    if not order_ref:
        return False, "invalid_order_ref", None
    token = secrets.token_urlsafe(24)
    _session_store[token] = f"bankid:{order_ref[:8]}"
    return True, None, token
