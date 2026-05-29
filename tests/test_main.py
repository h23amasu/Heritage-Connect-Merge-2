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
    data = response.json()
    assert data["status"] == "running"
    assert data["app"] == "Heritage Connect"


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
    response = client.post("/api/sms/send", json={
        "phone_number": "not-a-phone",
        "message": "test"
    })
    assert response.status_code == 422


def test_location_validation():
    """Location endpoint validates coordinates"""
    response = client.post("/api/location/update", json={
        "latitude": 200,
        "longitude": 18.0,
        "phoneNo": "+46738100354",
    })
    assert response.status_code == 422
