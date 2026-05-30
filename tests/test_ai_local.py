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


def test_ai_ask_falun_generic_question():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1027,
            "question": "Vad är unikt med detta världsarv?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is False
    assert "Stora stöten" in data["answer"] or "Falun" in data["answer"]
    assert "engelsbergs_bruk.txt" not in data["sources"]


def test_ai_ask_falun_when_created():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1027,
            "question": "När skapades det?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is False
    assert "1300" in data["answer"] or "2001" in data["answer"] or "världsarv" in data["answer"].lower()
