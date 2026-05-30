"""
Tests for notification API (no database required).
"""
from fastapi.testclient import TestClient

from app.main import app
from app.services.cooldown_service import cooldown_service

client = TestClient(app)


def setup_function():
    cooldown_service.clear()


def test_notification_sms_success():
    response = client.post(
        "/notification/send-notification",
        json={
            "type": "sms",
            "to": "+46738100354",
            "message": "Hej!",
            "user_id": "u1",
            "site_id": "site_1",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data == {"success": True, "channel": "sms"}


def test_notification_email_success():
    response = client.post(
        "/notification/send-notification",
        json={
            "type": "email",
            "to": "test@example.com",
            "message": "Hej!",
            "subject": "Ämne",
        },
    )
    assert response.status_code == 200
    assert response.json()["channel"] == "email"


def test_notification_invalid_type():
    response = client.post(
        "/notification/send-notification",
        json={
            "type": "SMS",
            "to": "+46738100354",
            "message": "Hej!",
        },
    )
    assert response.status_code == 400
    assert response.json() == {"success": False, "error": "invalid_type"}


def test_notification_blocked_phone():
    response = client.post(
        "/notification/send-notification",
        json={
            "type": "sms",
            "to": "0700000000",
            "message": "Hej!",
        },
    )
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_recipient"


def test_notification_invalid_recipient_phone():
    response = client.post(
        "/notification/send-notification",
        json={
            "type": "sms",
            "to": "0738100354",
            "message": "Hej!",
        },
    )
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_recipient"


def test_notification_invalid_recipient_email():
    response = client.post(
        "/notification/send-notification",
        json={
            "type": "email",
            "to": "not-an-email",
            "message": "Hej!",
        },
    )
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_recipient"


def test_notification_cooldown():
    payload = {
        "type": "sms",
        "to": "+46738100354",
        "message": "Hej!",
        "user_id": "u1",
        "site_id": "site_1",
    }
    assert client.post("/notification/send-notification", json=payload).status_code == 200
    response = client.post("/notification/send-notification", json=payload)
    assert response.status_code == 429
    assert response.json() == {"success": False, "error": "cooldown"}


def test_notification_no_provider_in_response():
    response = client.post(
        "/notification/send-notification",
        json={
            "type": "sms",
            "to": "+46738100354",
            "message": "Test",
        },
    )
    body = response.json()
    assert "provider" not in body
    assert "twilio" not in str(body).lower()
    assert "hellosms" not in str(body).lower()


def test_legacy_sms_send_no_provider_in_response():
    response = client.post(
        "/api/sms/send",
        json={
            "phone_number": "+46738100354",
            "message": "Test",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body == {"success": True, "channel": "sms"}
    assert "hellosms" not in str(body).lower()
    assert "twilio" not in str(body).lower()
