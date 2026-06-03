"""Landningssida: språk i HTML från servern."""
from app.services.landing_page import render_landing_html


def test_render_landing_html_italian_ui():
    html = render_landing_html("it")
    assert 'lang="it"' in html
    assert "Sei vicino a un sito del patrimonio mondiale UNESCO" in html
    assert "Gestisci abbonamento e profilo" in html
    assert "Chiedi" in html
    assert "Du är nära ett UNESCO-världsarv" not in html


def test_render_landing_html_swedish_default():
    html = render_landing_html("sv")
    assert "Du är nära ett UNESCO-världsarv" in html
