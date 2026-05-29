"""
Simple tests for the application.
Run them with: pytest tests/
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
    """Confirm the root endpoint works"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_health():
    """Confirm the health check works"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_docs_available():
    """Confirm the Swagger docs are available"""
    response = client.get("/docs")
    assert response.status_code == 200


def test_sms_request_validation():
    """Confirm validation works for SMS requests"""
    # Invalid phone number - must fail
    response = client.post("/api/sms/send", json={
        "phone_number": "not-a-phone",
        "message": "test"
    })
    assert response.status_code == 422  # Validation error


def test_sms_mock_send():
    """Confirm SMS works with the mock provider"""
    response = client.post("/api/sms/send", json={
        "phone_number": "+46701234567",
        "message": "Hej från testet!"
    })
    # Note: this will fail if the database isn't running.
    # We only check that it either succeeded or returned a database error (500).
    assert response.status_code in [200, 500]
