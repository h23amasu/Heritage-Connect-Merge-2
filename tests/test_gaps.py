"""Tester för landningssida, e-postauth och betalningsconfig."""
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import _email_otp_store, _otp_store

client = TestClient(app)


def setup_function():
    _otp_store.clear()
    _email_otp_store.clear()


def test_public_site_by_unesco_id():
    response = client.get("/api/sites/public/1027?lang=sv")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["unesco_id"] == "1027"
    assert "Falun" in data["name"]


def test_site_landing_html():
    response = client.get("/sites/1027")
    assert response.status_code == 200
    assert "Heritage Connect" in response.text


def test_payment_config_endpoint():
    response = client.get("/api/payments/config")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "provider" in data
    assert "stripe_enabled" in data


def test_email_auth_flow():
    client.post(
        "/api/auth/request-email-code",
        json={"email": "test@example.com", "purpose": "login"},
    )
    response = client.post(
        "/api/auth/verify-email-code",
        json={"email": "test@example.com", "code": "123456"},
    )
    assert response.status_code == 200
    assert response.json()["method"] == "email"
    assert "access_token" in response.json()
