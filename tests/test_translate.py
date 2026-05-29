"""Tester för översättnings-API."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_translate_sv_to_en():
    response = client.post(
        "/api/translate",
        json={
            "text": "Du är nära Engelsbergs bruk. Läs mer.",
            "source_language": "sv",
            "target_language": "en",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "near" in data["translated_text"].lower() or "You" in data["translated_text"]


def test_translate_invalid_language_code():
    response = client.post(
        "/api/translate",
        json={
            "text": "Hej",
            "source_language": "sv",
            "target_language": "1x",
        },
    )
    assert response.status_code == 400


def test_translate_batch():
    response = client.post(
        "/api/translate/batch",
        json={
            "texts": ["Nyheter", "Kultur"],
            "source_language": "sv",
            "target_language": "en",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["translations"]) == 2
