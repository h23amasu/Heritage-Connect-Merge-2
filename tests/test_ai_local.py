"""AI svarar från lokala filer utan databas – strikt utan gissningar."""
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai_service import QuestionIntent, classify_question_intent

client = TestClient(app)


def test_ai_ask_local_pdf_listing_year():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 556,
            "question": "När blev platsen UNESCO-världsarv?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "1993" in data["answer"]
    assert data["needs_followup"] is False


def test_ai_ask_we_return_off_topic():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1027,
            "question": "Vad kostar parkeringen på månen?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is True


def test_ai_ask_falun_generic_question_no_guess():
    """Vag fråga utan träff i källtext → ingen påhittad sammanfattning."""
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
    assert "lokala källorna" in data["answer"].lower()
    assert "Stora stöten" not in data["answer"]


def test_ai_ask_falun_creation_not_guessed_from_random_years():
    """'När skapades' ska inte plocka 1300/1700-tal ur beskrivningen."""
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
    assert "lokala källorna" in data["answer"].lower()
    assert "1300" not in data["answer"]
    assert "2001" not in data["answer"]


def test_ai_ask_falun_listing_year_explicit():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1027,
            "question": "När listades platsen som UNESCO världsarv?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "2001" in data["answer"]
    assert data["needs_followup"] is False


def test_ai_ask_falun_country_metadata():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1027,
            "question": "Var ligger det?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "Sverige" in data["answer"]
    assert " is located in " not in data["answer"]


def test_ai_ask_var_bor_jag_not_site_country():
    """Personlig fråga ska inte ge 'Platsen ligger i Sverige'."""
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1027,
            "question": "Var bor jag?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is True
    assert "Platsen ligger i" not in data["answer"]
    assert "världsarvskällorna" in data["answer"].lower()


def test_classify_intent_reads_full_question():
    assert classify_question_intent("Var bor jag?") == QuestionIntent.PERSONAL
    assert classify_question_intent("Var ligger det?") == QuestionIntent.SITE_LOCATION
    assert (
        classify_question_intent("När listades platsen som UNESCO världsarv?")
        == QuestionIntent.SITE_LISTING_YEAR
    )


def test_ai_ask_acropolis_parthenon_from_whc_long_text():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 404,
            "question": "What is the Parthenon?",
            "language": "en",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is False
    assert "Parthenon" in data["answer"]
    assert "whc001.json" in " ".join(data.get("sources") or [])


def test_ai_semantic_chunk_democracy_acropolis():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 404,
            "question": "What does the site say about democracy?",
            "language": "en",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "democracy" in data["answer"].lower()


def test_ai_ask_grimeton_what_is():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1134,
            "question": "vad är grimeton?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is False
    assert "grimeton" in data["answer"].lower()
    assert "lokala källorna" not in data["answer"].lower()


def test_ai_ask_finnish_listing_year():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1134,
            "question": "Milloin paikka listattiin UNESCO-maailmanperinnöksi?",
            "language": "fi",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "2004" in data["answer"]
    assert data["needs_followup"] is False


def test_ai_ask_french_grimeton_question():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1134,
            "question": "Qu'est-ce que Grimeton?",
            "language": "fr",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is False
    assert "grimeton" in data["answer"].lower()
    assert "lokala källorna" not in data["answer"].lower()
    assert "local sources" not in data["answer"].lower()


def test_classify_intent_multilingual():
    assert (
        classify_question_intent("Milloin paikka tuli UNESCO-maailmanperinnöksi?")
        == QuestionIntent.SITE_LISTING_YEAR
    )
    assert classify_question_intent("Wo liegt es?") == QuestionIntent.SITE_LOCATION


def test_ai_ask_unesco_official_languages_listing_year():
    """UNESCO:s språk: en, fr, es, ar, ru, zh (+ sv) – metadata år."""
    cases = [
        ("fr", "Quand le site a-t-il été inscrit au patrimoine mondial UNESCO?"),
        ("es", "¿Cuándo se inscribió el sitio como patrimonio mundial de la UNESCO?"),
        ("ru", "Когда объект был включён в список всемирного наследия ЮНЕСКО?"),
        ("zh", "该遗产何时列入联合国教科文组织世界遗产名录？"),
    ]
    for lang, question in cases:
        response = client.post(
            "/api/ai/ask",
            json={"site_id": 1134, "question": question, "language": lang},
        )
        assert response.status_code == 200, lang
        assert "2004" in response.json()["answer"], lang


def test_ai_ask_arabic_grimeton_desc():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1134,
            "question": "ما هو Grimeton؟",
            "language": "ar",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is False
    answer = data["answer"]
    assert (
        "grimeton" in answer.lower()
        or "غرايمتون" in answer
        or "فاربورغ" in answer
    )


def test_ai_ask_keyword_citation_from_description():
    response = client.post(
        "/api/ai/ask",
        json={
            "site_id": 1027,
            "question": "Vad säger källorna om koppar och gruvdrift?",
            "language": "sv",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["needs_followup"] is False
    lower = data["answer"].lower()
    assert "copper" in lower or "koppar" in lower or "mining" in lower or "gruv" in lower
