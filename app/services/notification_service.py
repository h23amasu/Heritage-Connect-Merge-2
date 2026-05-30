"""
Shared notification API – SMS and email, async dispatch, provider-agnostic.
"""
import logging
import re
from typing import Optional

from pydantic import EmailStr, TypeAdapter

from app.core.phone_policy import is_blocked_phone
from app.schemas import NotificationRequest, SMSRequest
from app.services.cooldown_service import cooldown_service
from app.services.email_service import EmailDeliveryError, send_email
from app.services.sms_service import send_sms

logger = logging.getLogger(__name__)

PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")
_email_adapter = TypeAdapter(EmailStr)

VALID_TYPES = frozenset({"sms", "email"})
ERROR_INVALID_TYPE = "invalid_type"
ERROR_INVALID_RECIPIENT = "invalid_recipient"
ERROR_COOLDOWN = "cooldown"


def validate_type(notification_type: str) -> Optional[str]:
    if notification_type not in VALID_TYPES:
        return ERROR_INVALID_TYPE
    return None


def validate_recipient(notification_type: str, to: str) -> Optional[str]:
    if notification_type == "sms":
        if is_blocked_phone(to):
            return ERROR_INVALID_RECIPIENT
        if not PHONE_PATTERN.match(to):
            return ERROR_INVALID_RECIPIENT
    elif notification_type == "email":
        try:
            _email_adapter.validate_python(to)
        except Exception:
            return ERROR_INVALID_RECIPIENT
    return None


def validate_notification_request(request: NotificationRequest) -> Optional[str]:
    err = validate_type(request.channel)
    if err:
        return err
    if not request.message or not request.message.strip():
        return ERROR_INVALID_RECIPIENT
    return validate_recipient(request.channel, request.to)


def check_cooldown(request: NotificationRequest) -> bool:
    return cooldown_service.is_on_cooldown(
        request.channel,
        request.to,
        request.user_id,
        request.site_id,
    )


def record_cooldown(request: NotificationRequest) -> None:
    cooldown_service.record_send(
        request.channel,
        request.to,
        request.user_id,
        request.site_id,
    )


def _parse_site_id(site_id: Optional[str]) -> Optional[int]:
    if site_id is None:
        return None
    if str(site_id).isdigit():
        return int(site_id)
    return None


def dispatch_notification(request: NotificationRequest) -> bool:
    """Skickar SMS/e-post. Returnerar True om leveransen lyckades."""
    try:
        if request.channel == "sms":
            sms_request = SMSRequest(
                phone_number=request.to,
                message=request.message[:160],
                site_id=_parse_site_id(request.site_id),
            )
            result = send_sms(sms_request)
            if result.status != "sent":
                logger.error(
                    "SMS delivery failed to=%s site_id=%s",
                    request.to,
                    request.site_id,
                )
                return False
            return True
        subject = request.subject or "Meddelande"
        send_email(request.to, subject, request.message)
        return True
    except EmailDeliveryError:
        logger.exception(
            "E-postleverans misslyckades till %s (kontrollera .env: EMAIL_PROVIDER, SMTP/SendGrid)",
            request.to,
        )
        raise
    except Exception:
        logger.exception(
            "Notification dispatch failed channel=%s to=%s",
            request.channel,
            request.to,
        )
        raise
