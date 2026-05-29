"""
Översättningstjänst – internt återanvändbart API.
Ordbok för vanliga fraser + valfri deep-translator (Google) som backup.
"""
from __future__ import annotations

from app.core.config import settings

import re

# Vanliga språk i demo – API accepterar alla tvåbokstaviga ISO 639-1-koder via Google Translate.
SUPPORTED_LANGUAGES = frozenset({
    "sv", "en", "de", "fr", "es", "no", "da",
    "ar", "zh", "ru", "fi", "pt", "it", "nl", "pl", "ja", "ko",
})

_LANG_CODE = re.compile(r"^[a-z]{2}$")


def normalize_language_code(code: str) -> str:
    return (code or "").lower().strip()[:2]


def is_valid_language_code(code: str) -> bool:
    return bool(_LANG_CODE.match(normalize_language_code(code)))

_PHRASES: dict[tuple[str, str], dict[str, str]] = {
    ("sv", "en"): {
        "Du är nära": "You are near",
        "Läs mer": "Read more",
        "Världsarv nära dig": "World heritage near you",
        "Prenumeration bekräftad": "Subscription confirmed",
        "Heritage Connect": "Heritage Connect",
        "Engelsbergs bruk": "Engelsberg Ironworks",
        "Du är nära Engelsbergs bruk. Läs mer.": "You are near Engelsberg Ironworks. Read more.",
    },
    ("en", "sv"): {
        "You are near": "Du är nära",
        "Read more": "Läs mer",
        "World heritage near you": "Världsarv nära dig",
    },
    ("sv", "de"): {
        "Du är nära": "Sie sind in der Nähe von",
        "Läs mer": "Mehr lesen",
    },
    ("sv", "fr"): {
        "Du är nära": "Vous êtes près de",
        "Läs mer": "En savoir plus",
    },
}


def _translate_dictionary(text: str, source: str, target: str) -> str:
    table = _PHRASES.get((source, target), {})
    result = text
    for src_phrase, tgt_phrase in sorted(table.items(), key=lambda x: -len(x[0])):
        if src_phrase in result:
            result = result.replace(src_phrase, tgt_phrase)
    return result


def _translate_deep(text: str, source: str, target: str) -> str | None:
    try:
        from deep_translator import GoogleTranslator

        translated = GoogleTranslator(source=source, target=target).translate(text)
        return translated if translated else None
    except Exception:
        return None


def translate_texts(texts: list[str], source_lang: str, target_lang: str) -> list[str]:
    return [translate_text(text, source_lang, target_lang) for text in texts]


def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    source = normalize_language_code(source_lang)
    target = normalize_language_code(target_lang)

    if source == target:
        return text

    provider = (settings.TRANSLATE_PROVIDER or "auto").lower()

    dict_result = _translate_dictionary(text, source, target)
    if dict_result != text and provider == "dictionary":
        return dict_result

    if provider in ("deep", "auto"):
        deep_result = _translate_deep(text, source, target)
        if deep_result:
            return deep_result

    if dict_result != text:
        return dict_result

    if provider == "auto" or provider == "dictionary":
        return dict_result

    return text
