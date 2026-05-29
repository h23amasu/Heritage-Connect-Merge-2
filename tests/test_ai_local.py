"""AI svarar från lokala filer utan databas."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ai_ask_local_pdf():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1,
            "question": "När blev Engelsbergs bruk världsarv?",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["answer"]) > 10
    assert data["sources"]
    assert data["needs_followup"] is False


def test_ai_ask_we_return():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1,
            "question": "Vad kostar parkeringen på månen?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "återkommer" in data["answer"].lower()
    assert data["needs_followup"] is True
