"""
Autentisering – SMS-engångskod och BankID (mock eller riktig RP).
"""
from __future__ import annotations

import logging
import secrets
import threading
import time
from typing import Optional

from app.core.phone_policy import is_blocked_phone
from app.schemas import NotificationRequest
from app.services.notification_service import dispatch_notification

logger = logging.getLogger(__name__)

# phone -> {code, expires_at}
_otp_store: dict[str, dict] = {}
# email -> {code, expires_at}
_email_otp_store: dict[str, dict] = {}
# token -> phone
_session_store: dict[str, str] = {}

OTP_TTL_SECONDS = 300


def _generate_otp_code() -> str:
    return f"{secrets.randbelow(900000) + 100000:06d}"


def normalize_phone(phone: str) -> str:
    p = phone.strip().replace(" ", "").replace("-", "")
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

    code = _generate_otp_code()
    _otp_store[normalized] = {
        "code": code,
        "expires_at": time.time() + OTP_TTL_SECONDS,
    }

    message = f"Din Heritage Connect-kod: {code}. Giltig i 5 min."
    notification = NotificationRequest(
        channel="sms",
        to=normalized,
        message=message,
        user_id=normalized,
    )
    _dispatch_login_code_async(notification)
    return True, None, code


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _dispatch_login_code_async(notification: NotificationRequest) -> None:
    """Skicka OTP i bakgrunden så inloggnings-endpointen svarar direkt."""

    def _run() -> None:
        try:
            dispatch_notification(notification)
        except Exception:
            logger.exception(
                "Kunde inte skicka inloggningskod till %s – koden finns sparad lokalt",
                notification.to,
            )

    threading.Thread(target=_run, daemon=True).start()


def request_email_code(email: str) -> tuple[bool, Optional[str], Optional[str]]:
    """Skickar OTP via e-post (samma notification-API som kvitton)."""
    normalized = _normalize_email(email)
    if "@" not in normalized:
        return False, "invalid_recipient", None

    code = _generate_otp_code()
    _email_otp_store[normalized] = {
        "code": code,
        "expires_at": time.time() + OTP_TTL_SECONDS,
    }

    message = f"Din Heritage Connect-inloggningskod: {code}. Giltig i 5 min."
    notification = NotificationRequest(
        channel="email",
        to=normalized,
        message=message,
        subject="Heritage Connect – inloggningskod",
        user_id=normalized,
    )
    _dispatch_login_code_async(notification)
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


def issue_bankid_session(user_key: str) -> str:
    token = secrets.token_urlsafe(24)
    _session_store[token] = f"bankid:{user_key}"
    return token


def bankid_start() -> dict:
    """Legacy mock entry – använd bankid_service.start_auth med end_user_ip."""
    from app.services.bankid_service import mock_start

    return mock_start()


def bankid_start_for_ip(end_user_ip: str) -> dict:
    from app.services.bankid_service import start_auth

    return start_auth(end_user_ip)


def bankid_collect(order_ref: str) -> dict:
    from app.services.bankid_service import collect_order

    return collect_order(order_ref, issue_bankid_session)


def bankid_qr_content(order_ref: str) -> Optional[str]:
    from app.services.bankid_service import get_qr_content

    return get_qr_content(order_ref)


def bankid_complete(order_ref: str) -> tuple[bool, Optional[str], Optional[str], Optional[str]]:
    result = bankid_collect(order_ref)
    if result.get("status") == "complete":
        return True, None, result.get("access_token"), result.get("user_id")
    if result.get("status") == "pending":
        return False, "pending", None, None
    return False, result.get("error") or "bankid_failed", None, None
