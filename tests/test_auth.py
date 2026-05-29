"""Tester för auth-API."""
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import _email_otp_store, _otp_store

client = TestClient(app)


def setup_function():
    _otp_store.clear()
    _email_otp_store.clear()


def test_verify_code_with_dev_code():
    client.post(
        "/api/auth/request-code",
        json={"phone": "+46738100354", "purpose": "login"},
    )
    response = client.post(
        "/api/auth/verify-code",
        json={"phone": "+46738100354", "code": "123456"},
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "access_token" in response.json()
