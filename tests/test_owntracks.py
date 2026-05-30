"""Tests for OwnTracks HTTP webhook."""
import json

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_owntracks_ignores_empty_body():
    response = client.post("/api/location/owntracks", content=b"")
    assert response.status_code == 200
    assert response.json() == []


def test_owntracks_ignores_non_location():
    response = client.post(
        "/api/location/owntracks",
        json={"_type": "cmd", "action": "dump"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_owntracks_requires_phone(monkeypatch):
    monkeypatch.setattr(settings, "GEOFENCING_DEMO_MODE", True)
    response = client.post(
        "/api/location/owntracks",
        json={"_type": "location", "lat": 59.97, "lon": 15.71, "tst": 1, "tid": "01"},
    )
    assert response.status_code == 400


def test_owntracks_processes_location_demo(monkeypatch):
    monkeypatch.setattr(settings, "GEOFENCING_DEMO_MODE", True)
    monkeypatch.setattr(settings, "DEFAULT_HOME_RADIUS_KM", 0.01)

    phone = "+46738100354"
    headers = {"X-Limit-U": phone}

    first = client.post(
        "/api/location/owntracks",
        headers=headers,
        json={"_type": "location", "lat": 59.0, "lon": 18.0, "tst": 1, "tid": "01"},
    )
    assert first.status_code == 200
    assert first.json() == []

    second = client.post(
        "/api/location/owntracks",
        headers=headers,
        json={"_type": "location", "lat": 59.9678, "lon": 15.7089, "tst": 2, "tid": "01"},
    )
    assert second.status_code == 200
    assert second.json() == []


def test_owntracks_basic_auth(monkeypatch):
    monkeypatch.setattr(settings, "OWOTRACKS_HTTP_USER", "heritage")
    monkeypatch.setattr(settings, "OWOTRACKS_HTTP_PASSWORD", "secret")

    unauthorized = client.post(
        "/api/location/owntracks",
        json={"_type": "location", "lat": 1, "lon": 1},
    )
    assert unauthorized.status_code == 401

    import base64

    token = base64.b64encode(b"heritage:secret").decode()
    authorized = client.post(
        "/api/location/owntracks",
        headers={
            "Authorization": f"Basic {token}",
            "X-Limit-U": "+46738100354",
        },
        json={"_type": "location", "lat": 59.97, "lon": 15.71, "tst": 1, "tid": "01"},
    )
    assert authorized.status_code == 200


def test_integration_config_includes_owntracks_url():
    response = client.get("/api/integration/config")
    assert response.status_code == 200
    data = response.json()
    assert "owntracks_webhook_url" in data
    assert data["owntracks_webhook_url"].endswith("/api/location/owntracks")
