"""PATCH /api/user/preferences i demo-läge ska inte gå via databasen."""
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app
from app.services.geofencing_demo import (
    _demo_notified,
    _demo_users,
    mark_demo_site_notified,
    process_location_demo,
)
from app.services.cooldown_service import cooldown_service

client = TestClient(app)
FALUN = (60.60472, 15.63083)
PHONE = "+46761104465"


def setup_function():
    _demo_users.clear()
    _demo_notified.clear()
    cooldown_service.clear()


def test_patch_visited_false_clears_demo_notified(monkeypatch):
    monkeypatch.setattr(settings, "GEOFENCING_DEMO_MODE", True)
    mark_demo_site_notified(PHONE, "1027")

    response = client.patch(
        "/api/user/preferences",
        json={"phone": PHONE, "site_id": "1027", "visited": False},
    )
    assert response.status_code == 200
    assert response.json()["demo_mode"] is True
    assert (PHONE, "1027") not in _demo_notified

    again = process_location_demo(
        PHONE, FALUN[0], FALUN[1], simulate_travel=True
    )
    assert again["notified"] is True
    assert (PHONE, "1027") in _demo_notified
