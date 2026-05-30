"""Tester för auth-API."""
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import _email_otp_store, _otp_store

client = TestClient(app)


def setup_function():
    _otp_store.clear()
    _email_otp_store.clear()


def test_bankid_mock_flow():
    start = client.post("/api/auth/bankid/start")
    assert start.status_code == 200
    payload = start.json()
    assert payload["success"] is True
    assert payload.get("mock") is True
    assert payload.get("order_ref")

    collect = client.post(
        "/api/auth/bankid/collect",
        json={"order_ref": payload["order_ref"]},
    )
    assert collect.status_code == 200
    data = collect.json()
    assert data["status"] == "complete"
    assert data.get("access_token")


def test_bankid_config():
    response = client.get("/api/auth/bankid/config")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "bankid_mock" in data


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
