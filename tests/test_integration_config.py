"""Integration config endpoint."""
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_integration_config():
    response = client.get("/api/integration/config")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["site_link_pattern"].endswith("/sites/{unesco_id}")
    assert "/notification/send-notification" in data["notification_api_url"]
    assert data["uses_external_notification_service"] == bool(
        settings.NOTIFICATION_SERVICE_URL.strip()
    )
