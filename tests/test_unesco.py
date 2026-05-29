"""UNESCO cache/sync."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_cached_sites():
    response = client.get("/api/unesco/sites")
    assert response.status_code == 200
    assert response.json()["count"] >= 1


def test_sync_unesco():
    response = client.post("/api/unesco/sync")
    assert response.status_code == 200
    assert response.json()["success"] is True
