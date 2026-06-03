"""
Skickar kvitto via gemensamma notification-API:t (e-post).
"""
from app.schemas import NotificationRequest
from app.services.message_builder import build_subscription_confirmation_email
from app.services.notification_service import dispatch_notification


def send_subscription_receipt(
    email: str,
    phone: str,
    end_date: str,
    language: str = "sv",
    user_id: str | None = None,
    *,
    notification_channel: str = "sms",
) -> None:
    subject, body = build_subscription_confirmation_email(
        phone,
        end_date,
        language,
        notification_channel=notification_channel,
    )
    request = NotificationRequest(
        channel="email",
        to=email,
        subject=subject,
        message=body,
        user_id=user_id,
    )
    dispatch_notification(request)
