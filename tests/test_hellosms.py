"""
Tests for HelloSMS integration (mocked HTTP).
"""
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.services.cooldown_service import cooldown_service
from app.schemas import SMSRequest
from app.services.sms_service import HelloSMSProvider

client = TestClient(app)


def setup_function():
    cooldown_service.clear()


MOCK_HELLOSMS_RESPONSE = {
    "status": "success",
    "statusText": "messagereceivedsuccessfullybythesystem",
    "messageIds": [
        {
            "apiMessageId": "api-test-123",
            "to": "+46738100354",
            "status": 0,
            "message": "Hej!",
        }
    ],
}


@patch("app.services.hellosms_client.settings.HELLOSMS_API_USERNAME", "user")
@patch("app.services.hellosms_client.settings.HELLOSMS_API_PASSWORD", "pass")
@patch("app.services.hellosms_client.httpx.Client")
def test_hellosms_provider_send(mock_client_cls):
    mock_response = mock_client_cls.return_value.__enter__.return_value.post
    mock_response.return_value.status_code = 200
    mock_response.return_value.json.return_value = MOCK_HELLOSMS_RESPONSE

    provider = HelloSMSProvider()
    result = provider.send(
        SMSRequest(phone_number="+46738100354", message="Hej!", site_id=1)
    )

    assert result.status == "sent"
    assert result.message_id != "api-test-123"
    assert "hellosms" not in result.message_id.lower()
    assert "twilio" not in result.message_id.lower()
    mock_response.assert_called_once()
    call_kwargs = mock_response.call_args
    body = call_kwargs.kwargs["json"]
    assert body["to"] == "+46738100354"
    assert body["message"] == "Hej!"
    assert "Authorization" in call_kwargs.kwargs["headers"]


@patch("app.services.hellosms_client.send_sms_via_hellosms")
def test_dispatch_notification_calls_send_sms(mock_hellosms):
    from app.schemas import NotificationRequest
    from app.services.notification_service import dispatch_notification

    mock_hellosms.return_value = MOCK_HELLOSMS_RESPONSE

    with patch("app.services.notification_service.send_sms") as mock_sms:
        dispatch_notification(
            NotificationRequest(
                type="sms",
                to="+46738100354",
                message="Test",
            )
        )
        mock_sms.assert_called_once()
