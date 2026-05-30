"""
AI Service – svar enbart från lokala UNESCO-källor (PDF/txt), inte internet.
"""
import re
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.other import AIDocument
from app.services.heritage_sites_local import find_site_by_ref
from app.services.pdf_loader import load_local_documents

FALLBACK_NO_INFO_SV = (
    "Jag har inte tillräcklig information i de lokala källorna för att svara på den frågan."
)
FALLBACK_WE_RETURN_SV = (
    "Vi återkommer med mer information så snart vi kan."
)
FALLBACK_NO_INFO_EN = (
    "I don't have enough information in the local sources to answer that question."
)
FALLBACK_WE_RETURN_EN = (
    "We will get back to you with more information as soon as we can."
)

# Minsta relevans för att svara direkt (annars "vi återkommer")
_MIN_QUESTION_WORD_LEN = 3
_MIN_MATCH_SCORE = 1
_YEAR_PATTERN = re.compile(
    r"\b(\d{3,4})s?\b|(\d{1,2}00)-talet|århundrad|century|since|sedan",
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
        "vara",
        "finns",
        "gör",
        "where",
        "which",
        "vilken",
        "vilket",
        "vilka",
        "what",
    }
)
_GENERIC_QUESTION_HINTS = (
    "unikt",
    "unique",
    "historia",
    "history",
    "berätta",
    "beskriv",
    "describe",
    "tell me",
    "what is",
    "what makes",
    "vad är",
    "världsarv",
    "world heritage",
    "om detta",
    "about this",
    "vad kan",
    "what can",
)
_TEMPORAL_QUESTION_HINTS = (
    "när",
    "when",
    "år",
    "year",
    "date",
    "datum",
    "skapades",
    "skapad",
    "grundades",
    "grundad",
    "tillkom",
    "created",
    "founded",
    "established",
    "listades",
    "inscribed",
    "sedan",
    "since",
)
_LOCATION_QUESTION_HINTS = (
    "var ",
    "where",
    "land",
    "country",
    "plats",
    "location",
    "ligger",
    "located",
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


def search_documents(db: Optional[Session], site_id: int, question: str) -> List[AIDocument]:
    if db is None:
        return []
    try:
        return db.query(AIDocument).filter(AIDocument.site_id == site_id).all()
    except Exception:
        return []


def _question_words(question: str) -> list[str]:
    return [
        w.lower()
        for w in question.split()
        if len(w) > _MIN_QUESTION_WORD_LEN and w.lower() not in _QUESTION_STOP_WORDS
    ]


def _is_generic_site_question(question: str) -> bool:
    q = (question or "").lower()
    return any(hint in q for hint in _GENERIC_QUESTION_HINTS)


def _is_temporal_question(question: str) -> bool:
    q = (question or "").lower()
    return any(hint in q for hint in _TEMPORAL_QUESTION_HINTS)


def _is_location_question(question: str) -> bool:
    q = (question or "").lower()
    return any(hint in q for hint in _LOCATION_QUESTION_HINTS)


def _is_off_topic_question(question: str) -> bool:
    q = (question or "").lower()
    return any(hint in q for hint in _OFF_TOPIC_HINTS)


def _split_sentences(context: str) -> list[str]:
    return [
        s.strip()
        for s in context.replace("\n", " ").split(".")
        if s.strip() and len(s.strip()) > 20
    ]


def _join_sentences(sentences: list[str], max_sentences: int = 3) -> str:
    if not sentences:
        return ""
    answer = ". ".join(sentences[:max_sentences])
    if not answer.endswith("."):
        answer += "."
    return answer


def _summary_from_context(context: str, max_sentences: int = 3) -> str:
    sentences = _split_sentences(context)
    if not sentences:
        trimmed = context.strip()
        return trimmed[:600] + ("…" if len(trimmed) > 600 else "")
    return _join_sentences(sentences, max_sentences)


def _year_sentences(context: str) -> list[str]:
    hits = [sentence for sentence in _split_sentences(context) if _YEAR_PATTERN.search(sentence)]
    descriptive = [
        sentence
        for sentence in hits
        if "unesco världsarv sedan" not in sentence.lower()
        and "inscribed as unesco" not in sentence.lower()
        and not sentence.lower().startswith("land:")
        and not sentence.lower().startswith("kategori:")
    ]
    descriptive.sort(
        key=lambda sentence: (
            "talet" in sentence.lower() or "century" in sentence.lower(),
            "sedan" in sentence.lower() or "since" in sentence.lower(),
            len(sentence),
        ),
        reverse=True,
    )
    return descriptive or hits


def _heritage_listing_answer(site: dict, language: str) -> str:
    year = (site.get("year_inscribed") or "").strip()
    if not year:
        return ""
    lang = (language or "sv").lower()[:2]
    if lang == "en":
        return f"It was inscribed as a UNESCO World Heritage Site in {year}."
    return f"Platsen blev UNESCO-världsarv {year}."


def _location_answer(site: dict, language: str) -> str:
    country = (site.get("country") or "").strip()
    name = (site.get("name") or "").strip()
    if not country and not name:
        return ""
    lang = (language or "sv").lower()[:2]
    if lang == "en":
        if name and country:
            return f"{name} is located in {country}."
        return f"The site is located in {country}." if country else name
    if name and country:
        return f"{name} ligger i {country}."
    return f"Platsen ligger i {country}." if country else name


def _temporal_answer(site: Optional[dict], context: str, question: str, language: str) -> str:
    q = (question or "").lower()
    listing_words = ("världsarv", "unesco", "listed", "inscribed", "listades", "world heritage")
    if site and any(word in q for word in listing_words):
        listing = _heritage_listing_answer(site, language)
        if listing:
            return listing

    year_hits = _year_sentences(context)
    if year_hits:
        return _join_sentences(year_hits[:2])

    if site and site.get("year_inscribed"):
        listing = _heritage_listing_answer(site, language)
        if listing:
            lang = (language or "sv").lower()[:2]
            if lang == "en":
                return (
                    f"{listing} Our local sources also describe historical activity at the site "
                    "over a longer period."
                )
            return (
                f"{listing} I våra lokala källor beskrivs också att platsen har en lång historia."
            )

    return _summary_from_context(context)


def _answer_by_intent(
    question: str,
    site: Optional[dict],
    context: str,
    language: str,
) -> Optional[str]:
    if _is_off_topic_question(question):
        return None
    if _is_temporal_question(question):
        return _temporal_answer(site, context, question, language)
    if _is_location_question(question) and site:
        location = _location_answer(site, language)
        if location:
            return location
    if _is_generic_site_question(question):
        return _summary_from_context(context)
    return None


def _heritage_site_context(site_id: int | str, language: str) -> tuple[str, list[str]]:
    site = find_site_by_ref(str(site_id))
    if not site:
        return "", []

    lang = (language or "sv").lower()[:2]
    parts: list[str] = []
    sources: list[str] = []

    name = (site.get("name") or "").strip()
    if name:
        parts.append(name)

    year = (site.get("year_inscribed") or "").strip()
    if year:
        parts.append(f"UNESCO världsarv sedan {year}.")
        parts.append(f"Inscribed as UNESCO World Heritage in {year}.")

    country = (site.get("country") or "").strip()
    if country:
        parts.append(f"Land: {country}.")

    category = (site.get("category") or "").strip()
    if category:
        parts.append(f"Kategori: {category}.")

    for key in (f"desc_{lang}", "desc_sv", "desc_en", "description"):
        text = (site.get(key) or "").strip()
        if not text or text in parts:
            continue
        parts.append(text)
        sources.append(f"heritage-sites.json ({key})")
        if key in (f"desc_{lang}", "desc_sv"):
            break

    return "\n\n".join(parts), sources


def _score_sentence(sentence: str, words: list[str]) -> int:
    lower = sentence.lower()
    return sum(1 for w in words if w in lower)


def _pick_language_fallback(lang: str, kind: str) -> str:
    """kind: no_info | we_return"""
    lang = (lang or "sv").lower()[:2]
    if kind == "we_return":
        return FALLBACK_WE_RETURN_EN if lang == "en" else FALLBACK_WE_RETURN_SV
    return FALLBACK_NO_INFO_EN if lang == "en" else FALLBACK_NO_INFO_SV


def ask_ai(
    db: Optional[Session],
    site_id: int,
    question: str,
    language: str = "sv",
) -> Tuple[str, List[str], bool]:
    """
    Returns: (answer, sources, needs_followup)
    needs_followup=True betyder att svaret är "vi återkommer".
    """
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

    site = find_site_by_ref(str(site_id))
    context = "\n\n".join(context_parts)
    words = _question_words(question)
    sentences = _split_sentences(context)

    if not words:
        intent_answer = _answer_by_intent(question, site, context, language)
        if intent_answer:
            return intent_answer, sources, False
        return _pick_language_fallback(language, "we_return"), sources, True

    scored = [(s, _score_sentence(s, words)) for s in sentences]
    hits = [s for s, score in scored if score >= _MIN_MATCH_SCORE]
    hits.sort(key=lambda s: _score_sentence(s, words), reverse=True)

    if hits:
        answer = _join_sentences(hits[:3])
        return answer, sources, False

    intent_answer = _answer_by_intent(question, site, context, language)
    if intent_answer:
        return intent_answer, sources, False

    if _is_off_topic_question(question):
        return _pick_language_fallback(language, "we_return"), sources, True

    if context.strip():
        return _summary_from_context(context), sources, False

    return _pick_language_fallback(language, "no_info"), sources, False
