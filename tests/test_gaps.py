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
    assert "Stora stöten" in data["description"]
    assert "Great Pit" not in data["description"]


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


def test_payment_intent_requires_stripe():
    response = client.post("/api/payments/intent", json={"amount": 99})
    assert response.status_code == 503


def test_email_auth_flow():
    email = "test@example.com"
    client.post(
        "/api/auth/request-email-code",
        json={"email": email, "purpose": "login"},
    )
    code = _email_otp_store[email]["code"]
    response = client.post(
        "/api/auth/verify-email-code",
        json={"email": email, "code": code},
    )
    assert response.status_code == 200
    assert response.json()["method"] == "email"
    assert "access_token" in response.json()


def test_request_email_code_returns_before_slow_dispatch(monkeypatch):
    import time

    from app.services import auth_service

    def slow_dispatch(_notification):
        time.sleep(2)

    monkeypatch.setattr(auth_service, "dispatch_notification", slow_dispatch)

    started = time.time()
    response = client.post(
        "/api/auth/request-email-code",
        json={"email": "slow@example.com", "purpose": "login"},
    )
    elapsed = time.time() - started

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert elapsed < 1.0
