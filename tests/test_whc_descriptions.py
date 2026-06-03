"""whc001.json – description_en och justification_en."""
from app.services.whc_descriptions import combined_ai_context_text, get_whc_extended_texts


def test_whc_404_acropolis_texts():
    extended = get_whc_extended_texts("404")
    assert extended is not None
    assert "Acropolis" in extended["description_en"]
    assert "Parthenon" in extended["description_en"]
    assert len(extended["justification_en"]) > 5000
    assert "Democracy" in extended["justification_en"] or "democracy" in extended["justification_en"].lower()


def test_combined_ai_context_includes_both_fields():
    text, sources = combined_ai_context_text("404")
    assert "Parthenon" in text
    assert "Criterion" in text or "Integrity" in text
    assert "whc001.json (description_en)" in sources
    assert "whc001.json (justification_en)" in sources
