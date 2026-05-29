"""
SMS Service – provider-agnostic (mock / HelloSMS).

Leverantörsnamn och externa API-id får aldrig returneras till klienter.
"""
import uuid
from datetime import datetime
from abc import ABC, abstractmethod

from app.core.config import settings
from app.schemas import SMSRequest, SMSResponse


def _opaque_message_id() -> str:
    """Internt leverantörsoberoende id – exponeras aldrig i notification-API."""
    return uuid.uuid4().hex


class SMSProviderInterface(ABC):
    @abstractmethod
    def send(self, request: SMSRequest) -> SMSResponse:
        pass


class MockSMSProvider(SMSProviderInterface):
    def send(self, request: SMSRequest) -> SMSResponse:
        print(f"[MOCK SMS] To: {request.phone_number}")
        print(f"[MOCK SMS] Message: {request.message}")
        if request.site_id:
            print(f"[MOCK SMS] Site: {request.site_id}")

        return SMSResponse(
            status="sent",
            message_id=_opaque_message_id(),
            timestamp=datetime.now(),
        )


class HelloSMSProvider(SMSProviderInterface):
    """
    Skickar SMS via HelloSMS REST API (Basic Auth + JSON).
    Leverantören exponeras inte i notification-API:t.
    """

    def send(self, request: SMSRequest) -> SMSResponse:
        from app.services.hellosms_client import HelloSMSError, send_sms_via_hellosms

        subject = f"site_{request.site_id}" if request.site_id else None
        try:
            data = send_sms_via_hellosms(
                to=request.phone_number,
                message=request.message,
                subject=subject,
            )
        except HelloSMSError as exc:
            print(f"[HelloSMS FEL] {exc}")
            return SMSResponse(
                status="failed",
                message_id=_opaque_message_id(),
                timestamp=datetime.now(),
            )

        return SMSResponse(
            status="sent",
            message_id=_opaque_message_id(),
            timestamp=datetime.now(),
        )


def get_sms_provider() -> SMSProviderInterface:
    if settings.SMS_PROVIDER == "hellosms":
        return HelloSMSProvider()
    return MockSMSProvider()


def send_sms(request: SMSRequest) -> SMSResponse:
    return get_sms_provider().send(request)
