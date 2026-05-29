"""
SMS Service

Critical: this module is designed to be fully self-contained.
Per the course requirements it must be swappable with another group's
module without affecting the rest of the system.

The interface is fixed:
- send_sms(phone, message) -> SMSResponse
- This shape must be agreed upon by every group.
"""
import uuid
from datetime import datetime
from abc import ABC, abstractmethod

from app.core.config import settings
from app.schemas import SMSRequest, SMSResponse


class SMSProviderInterface(ABC):
    """
    Abstract interface for any SMS provider.
    Any new module (Twilio, 46elks, another group) must implement this interface.
    """

    @abstractmethod
    def send(self, request: SMSRequest) -> SMSResponse:
        pass


class MockSMSProvider(SMSProviderInterface):
    """
    Fake SMS provider for development and testing.
    Prints the message to the console instead of actually sending it.
    """

    def send(self, request: SMSRequest) -> SMSResponse:
        # Print the message so we can see it was "sent"
        print(f"📱 [MOCK SMS] To: {request.phone_number}")
        print(f"📱 [MOCK SMS] Message: {request.message}")
        if request.site_id:
            print(f"📱 [MOCK SMS] Site: {request.site_id}")

        return SMSResponse(
            status="sent",
            message_id=f"mock_{uuid.uuid4().hex[:12]}",
            timestamp=datetime.now(),
        )


class TwilioSMSProvider(SMSProviderInterface):
    """
    Real SMS provider using Twilio.
    Used in production.
    To enable: set TWILIO_* in the .env file and change SMS_PROVIDER=twilio
    """

    def send(self, request: SMSRequest) -> SMSResponse:
        # This is where you would import twilio and send the real message
        # from twilio.rest import Client
        # client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # message = client.messages.create(
        #     body=request.message,
        #     from_=settings.TWILIO_PHONE_NUMBER,
        #     to=request.phone_number,
        # )
        # return SMSResponse(status="sent", message_id=message.sid, ...)

        # For now we raise an error because it isn't enabled
        raise NotImplementedError(
            "Twilio is not enabled yet. Set SMS_PROVIDER=mock in .env"
        )


def get_sms_provider() -> SMSProviderInterface:
    """
    Factory function - returns the correct provider based on settings.
    This makes swapping providers easy: just change a value in .env
    """
    if settings.SMS_PROVIDER == "twilio":
        return TwilioSMSProvider()
    else:
        return MockSMSProvider()


# Single instance used across the project
sms_provider = get_sms_provider()


def send_sms(request: SMSRequest) -> SMSResponse:
    """
    Public function used by the rest of the project to send SMS.
    Hides the internal details - the caller only knows it sends a message.
    """
    return sms_provider.send(request)
