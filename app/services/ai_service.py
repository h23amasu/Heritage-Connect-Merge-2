"""
AI Service – svar enbart från lokala UNESCO-källor (PDF/txt), inte internet.

Läser hela frågan (intent först), svarar sedan utifrån källor utan gissning.
Med AI_PROVIDER=openai och OPENAI_API_KEY formuleras svaret naturligt men
enbart utifrån samma lokala kontext.
"""
from __future__ import annotations

import logging
import re
from difflib import SequenceMatcher
from enum import Enum
from typing import List, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.other import AIDocument
from app.services.heritage_sites_local import find_site_by_ref
from app.services.pdf_loader import load_local_documents
from app.services.whc_descriptions import combined_ai_context_text, get_whc_extended_texts

logger = logging.getLogger(__name__)

FALLBACK_NO_INFO_SV = (
    "Jag hittar inget tydligt svar på din fråga i de lokala källorna. "
    "Prova att formulera om, t.ex. med ord som finns i platsbeskrivningen, "
    "eller fråga när platsen blev UNESCO-världsarv."
)
FALLBACK_WE_RETURN_SV = (
    "Den frågan kan vi inte besvara utifrån världsarvskällorna. "
    "Ställ gärna en ny fråga om själva platsen."
)
FALLBACK_NO_INFO_EN = (
    "I could not find a clear answer to your question in the local sources. "
    "Try rephrasing using words from the site description, "
    "or ask when the site was inscribed as UNESCO World Heritage."
)
FALLBACK_WE_RETURN_EN = (
    "That question cannot be answered from the world heritage sources. "
    "Please ask a new question about this site."
)

_DECLINE_PERSONAL = "DECLINE_PERSONAL"
_DECLINE_OFF_TOPIC = "DECLINE_OFF_TOPIC"
_DECLINE_NO_INFO = "DECLINE_NO_INFO"

_MIN_QUESTION_WORD_LEN = 3
_MIN_WORD_MATCHES_SINGLE = 1
_MIN_WORD_MATCHES_MULTI = 2
_OPENAI_CONTEXT_MAX = 20000
_UNESCO_SECTION_SPLIT = re.compile(
    r"(?=(?:Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements))",
    re.IGNORECASE,
)

_QUESTION_STOP_WORDS = frozenset(
    {
        "what",
        "this",
        "that",
        "with",
        "about",
        "from",
        "have",
        "does",
        "detta",
        "denna",
        "dette",
        "den",
        "det",
        "är",
        "vara",
        "finns",
        "gör",
        "which",
        "vilken",
        "vilket",
        "vilka",
        "hur",
        "how",
        "why",
        "varför",
        "säger",
        "säga",
        "källorna",
        "källan",
        "sources",
        "källor",
        "kan",
        "inte",
        "the",
        "and",
        "site",
        "say",
        "säger",
    }
)
_LISTING_YEAR_HINTS = (
    "världsarv",
    "unesco",
    "listades",
    "inscribed",
    "world heritage",
    "världsarvslistan",
    "world heritage site",
)
_CREATION_HINTS = (
    "skapades",
    "grundades",
    "founded",
    "created",
    "tillkom",
    "anlades",
    "byggdes",
    "established",
    "built",
    "grunden",
)
_TEMPORAL_HINTS = (
    "när",
    "when",
    "år",
    "year",
    "datum",
    "date",
    "sedan",
    "since",
)
_SITE_LOCATION_PHRASES = (
    "var ligger",
    "where is it",
    "where is this",
    "where is the",
    "vilket land",
    "which country",
    "platsen ligger",
    "ligger platsen",
    "ligger det",
    "ligger den",
    "finns platsen",
    "världsarv",
    "world heritage",
    "unesco",
)
_PERSONAL_QUESTION_HINTS = (
    "var bor jag",
    "var bor du",
    "var bor man",
    "where do i live",
    "where do you live",
    "bor jag",
    "bor du",
    "mitt hem",
    "my home",
    "my address",
    "min adress",
    "var är jag",
    "where am i",
    "vem är jag",
    "who am i",
    "vad heter jag",
    "what is my name",
)
_OFF_TOPIC_HINTS = (
    "månen",
    "moon",
    "mars",
    "parkering",
    "parking",
    "kostar",
    "price",
    "öppettider",
    "opening hours",
)
_SITE_REFERENCE_WORDS = re.compile(
    r"\b(platsen|detta|det|den|site|heritage|världsarv|unesco|stället|objektet|här|falun|gruv)\b",
    re.IGNORECASE,
)
_CATEGORY_SV = {
    "Cultural": "Kultur",
    "Natural": "Natur",
    "Mixed": "Blandat",
}
_COUNTRY_SV = {
    "Sweden": "Sverige",
    "Norway": "Norge",
    "Denmark": "Danmark",
    "Finland": "Finland",
    "Germany": "Tyskland",
    "France": "Frankrike",
    "Italy": "Italien",
    "Spain": "Spanien",
    "United Kingdom": "Storbritannien",
    "Iceland": "Island",
}
_EN_WORDS = re.compile(
    r"\b(the|and|with|from|was|were|inscribed|heritage|site|area|mountain|located|cultural|since|world|great|mining)\b",
    re.IGNORECASE,
)
_SV_WORDS = re.compile(
    r"\b(och|från|sedan|platsen|gruv|världsarv|landet|är|som|den|det|ett|har|kring|boningshusen|regionen)\b",
    re.IGNORECASE,
)


class QuestionIntent(str, Enum):
    PERSONAL = "personal"
    OFF_TOPIC = "off_topic"
    SITE_LISTING_YEAR = "site_listing_year"
    SITE_LOCATION = "site_location"
    SITE_CATEGORY = "site_category"
    HERITAGE_CONTENT = "heritage_content"


def _normalize_language(language: str) -> str:
    return (language or "sv").lower()[:2]


def _site_display_name(site: dict, language: str) -> str:
    lang = _normalize_language(language)
    if lang == "sv":
        return (site.get("name_sv") or site.get("name") or "").strip()
    return (site.get("name") or site.get("name_sv") or "").strip()


def classify_question_intent(question: str) -> QuestionIntent:
    """Tolkar hela frågan i prioriterad ordning – inte enstaka nyckelord."""
    q = (question or "").strip().lower()
    if not q:
        return QuestionIntent.HERITAGE_CONTENT

    if _is_personal_question(q):
        return QuestionIntent.PERSONAL
    if _is_off_topic_question(q):
        return QuestionIntent.OFF_TOPIC
    if _asks_listing_year(q):
        return QuestionIntent.SITE_LISTING_YEAR
    if _asks_country(q):
        return QuestionIntent.SITE_LOCATION
    if _asks_category(q):
        return QuestionIntent.SITE_CATEGORY
    return QuestionIntent.HERITAGE_CONTENT


def _language_score(sentence: str, language: str) -> int:
    lang = _normalize_language(language)
    english_hits = len(_EN_WORDS.findall(sentence))
    swedish_hits = len(_SV_WORDS.findall(sentence))
    if lang == "en":
        return english_hits - swedish_hits
    return swedish_hits - english_hits


def _filter_sentences_for_language(sentences: list[str], language: str) -> list[str]:
    if not sentences:
        return sentences
    preferred = [sentence for sentence in sentences if _language_score(sentence, language) >= 0]
    ranked = preferred or sentences
    ranked = sorted(ranked, key=lambda sentence: _language_score(sentence, language), reverse=True)
    return ranked


def _pick_site_description(site: dict, language: str) -> tuple[str, str]:
    lang = _normalize_language(language)
    localized_key = f"desc_{lang}"
    localized = (site.get(localized_key) or "").strip()
    desc_en = (site.get("desc_en") or site.get("description") or "").strip()

    if localized and len(localized) >= 80:
        return localized, localized_key
    if localized and desc_en and len(localized) < len(desc_en) * 0.35:
        return desc_en, "desc_en"
    if localized:
        return localized, localized_key
    if desc_en:
        return desc_en, "desc_en"
    if lang != "sv":
        desc_sv = (site.get("desc_sv") or "").strip()
        if desc_sv:
            return desc_sv, "desc_sv"
    return "", ""


def search_documents(db: Optional[Session], site_id: int, question: str) -> List[AIDocument]:
    if db is None:
        return []
    try:
        return db.query(AIDocument).filter(AIDocument.site_id == site_id).all()
    except Exception:
        return []


def _question_words(question: str) -> list[str]:
    tokens = re.findall(r"\b[\wåäöÅÄÖéèêëü]+\b", (question or "").lower())
    return [
        w
        for w in tokens
        if len(w) >= _MIN_QUESTION_WORD_LEN and w not in _QUESTION_STOP_WORDS
    ]


def _min_required_word_matches(word_count: int) -> int:
    if word_count <= 1:
        return _MIN_WORD_MATCHES_SINGLE
    return _MIN_WORD_MATCHES_MULTI


def _is_off_topic_question(question: str) -> bool:
    q = (question or "").lower()
    if re.search(r"what does .+ mean\b", q) or "vad betyder" in q:
        return True
    return any(hint in q for hint in _OFF_TOPIC_HINTS)


def _is_personal_question(question: str) -> bool:
    q = (question or "").lower()
    if any(hint in q for hint in _PERSONAL_QUESTION_HINTS):
        return True
    if re.search(r"\bvar\s+(bor|är)\s+(jag|du|man|mig|dig)\b", q):
        return True
    if re.search(r"\b(where\s+do\s+i\s+live|where\s+am\s+i)\b", q):
        return True
    if re.search(r"\bvar\b", q) and re.search(r"\b(jag|du|man|mig|dig|mitt|min|hem)\b", q):
        if not _SITE_REFERENCE_WORDS.search(q):
            return True
    return False


def _split_sentences(context: str) -> list[str]:
    return [
        s.strip()
        for s in context.replace("\n", " ").split(".")
        if s.strip() and len(s.strip()) > 20
    ]


def _split_semantic_chunks(context: str) -> list[str]:
    """
    Styckeindela tung UNESCO-text (t.ex. justification_en) vid logiska avsnitt.
    Version 1.1 – bättre än punkt-för-punkt på tusentals tecken.
    """
    text = (context or "").strip()
    if not text:
        return []

    header = re.compile(
        r"^(Brief synthesis|Criterion\s*\([ivx]+\)|Integrity|Authenticity|Protection and management requirements)\s*:?\s*",
        re.IGNORECASE,
    )
    if _UNESCO_SECTION_SPLIT.search(text):
        parts = _UNESCO_SECTION_SPLIT.split(text)
        chunks = []
        for part in parts:
            piece = part.strip()
            if len(piece) < 50:
                continue
            match = header.match(piece)
            if match:
                piece = piece[match.end() :].strip() or piece
            if piece:
                chunks.append(piece)
        if chunks:
            return chunks

    paragraphs = [p.strip() for p in re.split(r"\n\s*\n+", text) if len(p.strip()) > 80]
    if len(paragraphs) > 1:
        return paragraphs

    return []


def _split_context_chunks(context: str) -> list[str]:
    semantic = _split_semantic_chunks(context)
    if semantic:
        return semantic
    return _split_sentences(context)


def _join_sentences(sentences: list[str], max_sentences: int = 3, language: str = "sv") -> str:
    filtered = _filter_sentences_for_language(sentences, language)
    if not filtered:
        return ""
    selected = filtered[:max_sentences]
    if any(len(s) > 220 for s in selected):
        return "\n\n".join(selected)
    answer = ". ".join(selected)
    if not answer.endswith("."):
        answer += "."
    return answer


def _heritage_listing_answer(site: dict, language: str) -> str:
    year = (site.get("year_inscribed") or "").strip()
    if not year:
        return ""
    name = _site_display_name(site, language)
    lang = _normalize_language(language)
    if lang == "en":
        if name:
            return f"{name} was inscribed as a UNESCO World Heritage Site in {year}."
        return f"It was inscribed as a UNESCO World Heritage Site in {year}."
    if name:
        return f"{name} blev UNESCO-världsarv {year}."
    return f"Platsen blev UNESCO-världsarv {year}."


def _location_answer(site: dict, language: str) -> str:
    country = (site.get("country") or "").strip()
    name = _site_display_name(site, language)
    if not country and not name:
        return ""
    lang = _normalize_language(language)
    if lang == "en":
        if name and country:
            return f"{name} is located in {country}."
        return f"The site is located in {country}." if country else name
    country_display = _COUNTRY_SV.get(country, country)
    if name and country_display:
        return f"{name} ligger i {country_display}."
    return f"Platsen ligger i {country_display}." if country_display else ""


def _category_answer(site: dict, language: str) -> str:
    category = (site.get("category") or "").strip()
    if not category:
        return ""
    name = _site_display_name(site, language)
    lang = _normalize_language(language)
    if lang == "en":
        if name:
            return f"{name} is listed as a {category} World Heritage property."
        return f"The site is listed as a {category} World Heritage property."
    display = _CATEGORY_SV.get(category, category)
    if name:
        return f"{name} är klassad som {display} världsarv."
    return f"Platsen är klassad som {display} världsarv."


def _asks_listing_year(question: str) -> bool:
    q = question.lower()
    has_temporal = any(h in q for h in _TEMPORAL_HINTS)
    has_listing = any(h in q for h in _LISTING_YEAR_HINTS)
    has_creation = any(h in q for h in _CREATION_HINTS)
    if has_creation and not has_listing:
        return False
    return has_temporal and has_listing


def _asks_country(question: str) -> bool:
    if _is_personal_question(question):
        return False
    q = question.lower()
    if any(h in q for h in _LISTING_YEAR_HINTS + _CREATION_HINTS):
        return False
    if any(phrase in q for phrase in _SITE_LOCATION_PHRASES):
        return True
    return bool(
        re.search(r"\bvar\s+ligger\s+(det|den|platsen|detta|site)\b", q)
        or re.search(r"\bwhere\s+(is|are)\s+(it|this|the)\b", q)
    )


def _asks_category(question: str) -> bool:
    q = question.lower()
    return any(
        hint in q
        for hint in (
            "kategori",
            "category",
            "kulturarv",
            "cultural",
            "natural",
            "naturarv",
            "blandat",
            "mixed",
            "typ av världsarv",
            "type of heritage",
        )
    )


def _structured_metadata_answer(
    intent: QuestionIntent, site: dict, language: str
) -> Optional[str]:
    if not site:
        return None
    if intent == QuestionIntent.SITE_LISTING_YEAR and site.get("year_inscribed"):
        return _heritage_listing_answer(site, language)
    if intent == QuestionIntent.SITE_LOCATION and site.get("country"):
        return _location_answer(site, language)
    if intent == QuestionIntent.SITE_CATEGORY and site.get("category"):
        return _category_answer(site, language)
    return None


def _heritage_site_context(site_id: int | str, language: str) -> tuple[str, list[str]]:
    site = find_site_by_ref(str(site_id))
    if not site:
        return "", []

    parts: list[str] = []
    sources: list[str] = []
    uid = str(site.get("unesco_id") or site_id or "").strip()

    lang = _normalize_language(language)
    whc_text, whc_sources = combined_ai_context_text(uid)
    if whc_text:
        parts.append(whc_text)
        sources.extend(whc_sources)

    description, source_key = _pick_site_description(site, language)
    if description and (not whc_text or lang != "en"):
        blob = "\n\n".join(parts)
        if description not in blob:
            parts.append(description)
            sources.append(f"heritage-sites.json ({source_key})")

    if not parts and description:
        parts.append(description)
        sources.append(f"heritage-sites.json ({source_key})")

    return "\n\n".join(parts), sources


def _word_matches_text(word: str, text: str) -> bool:
    if word in text:
        return True
    if len(word) >= 4 and word[:4] in text:
        return True
    return False


def _score_sentence(sentence: str, words: list[str]) -> int:
    lower = sentence.lower()
    return sum(1 for w in words if _word_matches_text(w, lower))


def _sentence_relevance(sentence: str, question: str, words: list[str]) -> float:
    """Hela frågan vägs in (likhet + nyckelord), inte bara enstaka ord."""
    word_score = float(_score_sentence(sentence, words))
    q_norm = re.sub(r"\s+", " ", (question or "").lower().strip())
    similarity = SequenceMatcher(None, q_norm, sentence.lower()).ratio()
    return word_score * 2.0 + similarity


def _cite_from_context(question: str, context: str, language: str) -> str:
    words = _question_words(question)
    if not words:
        return ""
    min_score = _min_required_word_matches(len(words))
    sentences = _filter_sentences_for_language(_split_context_chunks(context), language)
    ranked = sorted(
        sentences,
        key=lambda s: _sentence_relevance(s, question, words),
        reverse=True,
    )
    hits = [s for s in ranked if _score_sentence(s, words) >= min_score]
    if not hits:
        return ""
    return _join_sentences(hits[:3], language=language)


def _pick_language_fallback(lang: str, kind: str) -> str:
    lang = (lang or "sv").lower()[:2]
    if kind == "we_return":
        return FALLBACK_WE_RETURN_EN if lang == "en" else FALLBACK_WE_RETURN_SV
    return FALLBACK_NO_INFO_EN if lang == "en" else FALLBACK_NO_INFO_SV


def _openai_enabled() -> bool:
    return (
        (settings.AI_PROVIDER or "").lower() == "openai"
        and bool((settings.OPENAI_API_KEY or "").strip())
    )


def _site_facts_block(site: dict) -> str:
    lines: list[str] = []
    if site.get("name") or site.get("name_sv"):
        lines.append(f"Namn: {site.get('name_sv') or site.get('name')}")
    if site.get("country"):
        lines.append(f"Land: {site.get('country')}")
    if site.get("year_inscribed"):
        lines.append(f"UNESCO-listning (år): {site.get('year_inscribed')}")
    if site.get("category"):
        lines.append(f"Kategori: {site.get('category')}")
    return "\n".join(lines)


def _openai_system_prompt(language: str) -> str:
    lang = _normalize_language(language)
    if lang == "en":
        return (
            "You guide visitors at a UNESCO World Heritage site. Read the ENTIRE user question.\n"
            "Answer ONLY using CONTEXT and FACTS below. Do not use outside knowledge.\n"
            f"- Personal questions (where do I live, my address, who am I): reply exactly {_DECLINE_PERSONAL}\n"
            f"- Off-topic (parking, moon, prices): reply exactly {_DECLINE_OFF_TOPIC}\n"
            f"- Not in sources, or 'when was it created' without UNESCO listing in sources: {_DECLINE_NO_INFO}\n"
            "- Never invent years. Max 3 sentences in the same language as the question."
        )
    return (
        "Du är guide vid ett UNESCO-världsarv. Läs HELA användarens fråga.\n"
        "Svara ENDAST med fakta från KONTEXT och FAKTA nedan. Använd inte extern kunskap.\n"
        f"- Personliga frågor (var bor jag, min adress, vem är jag): svara exakt {_DECLINE_PERSONAL}\n"
        f"- Utanför ämnet (parkering, månen, priser): svara exakt {_DECLINE_OFF_TOPIC}\n"
        f"- Saknas i källor, eller 'när skapades' utan UNESCO-listning i källor: {_DECLINE_NO_INFO}\n"
        "- Hitta inte på årtal. Max 3 meningar på samma språk som frågan."
    )


def _map_openai_decline(text: str, language: str) -> Optional[Tuple[str, bool]]:
    stripped = (text or "").strip()
    upper = stripped.upper()
    if upper.startswith(_DECLINE_PERSONAL) or upper.startswith(_DECLINE_OFF_TOPIC):
        return _pick_language_fallback(language, "we_return"), True
    if upper.startswith(_DECLINE_NO_INFO):
        return _pick_language_fallback(language, "no_info"), False
    return None


def _try_openai_answer(
    question: str,
    context: str,
    site: dict,
    language: str,
) -> Optional[Tuple[str, bool]]:
    api_key = (settings.OPENAI_API_KEY or "").strip()
    if not api_key:
        return None

    site_name = _site_display_name(site, language) or site.get("name") or "UNESCO site"
    facts = _site_facts_block(site)
    ctx = context[:_OPENAI_CONTEXT_MAX]
    user_body = (
        f"PLATS: {site_name}\n"
        f"FAKTA:\n{facts or '(inga)'}\n\n"
        f"KONTEXT:\n{ctx}\n\n"
        f"FRÅGA: {question.strip()}"
    )

    try:
        with httpx.Client(timeout=45.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": (settings.OPENAI_MODEL or "gpt-4o-mini").strip(),
                    "temperature": 0,
                    "max_tokens": 500,
                    "messages": [
                        {"role": "system", "content": _openai_system_prompt(language)},
                        {"role": "user", "content": user_body},
                    ],
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception as exc:
        logger.warning("OpenAI AI answer failed: %s", exc)
        return None

    try:
        text = payload["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, TypeError):
        return None

    declined = _map_openai_decline(text, language)
    if declined:
        return declined
    if text:
        return text, False
    return None


def ask_ai(
    db: Optional[Session],
    site_id: int | str,
    question: str,
    language: str = "sv",
) -> Tuple[str, List[str], bool]:
    """
    Returns: (answer, sources, needs_followup)
    Tolkar hela frågan först, svarar sedan strikt från källor.
    """
    question = (question or "").strip()
    intent = classify_question_intent(question)

    local_files = load_local_documents(site_id)
    sources = [name for name, _ in local_files]
    context_parts = [text for _, text in local_files]

    heritage_text, heritage_sources = _heritage_site_context(site_id, language)
    if heritage_text:
        context_parts.insert(0, heritage_text)
        sources.extend(heritage_sources)

    documents = search_documents(db, site_id, question)
    if documents:
        context_parts.extend([doc.content or "" for doc in documents if doc.content])
        sources.extend([doc.filename for doc in documents])

    if not context_parts:
        return _pick_language_fallback(language, "no_info"), [], False

    site = find_site_by_ref(str(site_id)) or {}
    context = "\n\n".join(context_parts)

    if intent == QuestionIntent.PERSONAL:
        return _pick_language_fallback(language, "we_return"), sources, True
    if intent == QuestionIntent.OFF_TOPIC:
        return _pick_language_fallback(language, "we_return"), sources, True

    metadata_answer = _structured_metadata_answer(intent, site, language)
    if metadata_answer:
        return metadata_answer, sources, False

    if _openai_enabled() and intent == QuestionIntent.HERITAGE_CONTENT:
        openai_result = _try_openai_answer(question, context, site, language)
        if openai_result:
            return openai_result[0], sources, openai_result[1]

    cited = _cite_from_context(question, context, language)
    if cited:
        return cited, sources, False

    return _pick_language_fallback(language, "no_info"), sources, False
