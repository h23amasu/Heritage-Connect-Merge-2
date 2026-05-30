"""
Översättningstjänst – internt återanvändbart API.
Ordbok för vanliga fraser + valfri deep-translator (Google) som backup.
"""
from __future__ import annotations

from app.core.config import settings

import re

# ISO 639-1 (två bokstäver) – alla koder accepteras; översättning via Google Translate.
_LANG_CODE = re.compile(r"^[a-z]{2}$")

# Alias som Google Translate förväntar sig (ISO 639-1 → Google).
_GOOGLE_TRANSLATE_ALIASES: dict[str, str] = {
    "nb": "no",
    "nn": "no",
    "iw": "he",
    "in": "id",
    "ji": "yi",
    "jw": "jv",
}


def normalize_language_code(code: str) -> str:
    return (code or "").lower().strip().split("-")[0][:2]


def map_google_translate_code(code: str) -> str:
    normalized = normalize_language_code(code)
    return _GOOGLE_TRANSLATE_ALIASES.get(normalized, normalized)


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

        src = map_google_translate_code(source)
        tgt = map_google_translate_code(target)
        translated = GoogleTranslator(source=src, target=tgt).translate(text)
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
