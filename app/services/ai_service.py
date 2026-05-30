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
}
_EN_WORDS = re.compile(
    r"\b(the|and|with|from|was|were|inscribed|heritage|site|area|mountain|located|cultural|since|world|great|mining)\b",
    re.IGNORECASE,
)
_SV_WORDS = re.compile(
    r"\b(och|från|sedan|platsen|gruv|världsarv|landet|är|som|den|det|ett|har|kring|boningshusen|regionen)\b",
    re.IGNORECASE,
)


def _normalize_language(language: str) -> str:
    return (language or "sv").lower()[:2]


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
    if lang == "sv":
        for key in ("desc_sv", "desc_en", "description"):
            text = (site.get(key) or "").strip()
            if text:
                return text, key
        return "", ""
    for key in (f"desc_{lang}", "desc_en", "description", "desc_sv"):
        text = (site.get(key) or "").strip()
        if text:
            return text, key
    return "", ""


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


def _join_sentences(sentences: list[str], max_sentences: int = 3, language: str = "sv") -> str:
    filtered = _filter_sentences_for_language(sentences, language)
    if not filtered:
        return ""
    answer = ". ".join(filtered[:max_sentences])
    if not answer.endswith("."):
        answer += "."
    return answer


def _summary_from_context(context: str, max_sentences: int = 3, language: str = "sv") -> str:
    sentences = _filter_sentences_for_language(_split_sentences(context), language)
    if not sentences:
        trimmed = context.strip()
        return trimmed[:600] + ("…" if len(trimmed) > 600 else "")
    return _join_sentences(sentences, max_sentences, language)


def _year_sentences(context: str, language: str = "sv") -> list[str]:
    hits = [sentence for sentence in _split_sentences(context) if _YEAR_PATTERN.search(sentence)]
    descriptive = [
        sentence
        for sentence in hits
        if "unesco världsarv sedan" not in sentence.lower()
        and "inscribed as unesco" not in sentence.lower()
        and not sentence.lower().startswith("land:")
        and not sentence.lower().startswith("kategori:")
        and not sentence.lower().startswith("country:")
        and not sentence.lower().startswith("category:")
    ]
    descriptive = _filter_sentences_for_language(descriptive or hits, language)
    descriptive.sort(
        key=lambda sentence: (
            "talet" in sentence.lower() or "century" in sentence.lower(),
            "sedan" in sentence.lower() or "since" in sentence.lower(),
            _language_score(sentence, language),
            len(sentence),
        ),
        reverse=True,
    )
    return descriptive


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
    lang = _normalize_language(language)
    if lang == "en":
        if name and country:
            return f"{name} is located in {country}."
        return f"The site is located in {country}." if country else name
    country_display = _COUNTRY_SV.get(country, country)
    return f"Platsen ligger i {country_display}." if country_display else "Platsen ligger i Sverige."


def _temporal_answer(site: Optional[dict], context: str, question: str, language: str) -> str:
    q = (question or "").lower()
    listing_words = ("världsarv", "unesco", "listed", "inscribed", "listades", "world heritage")
    if site and any(word in q for word in listing_words):
        listing = _heritage_listing_answer(site, language)
        if listing:
            return listing

    year_hits = _year_sentences(context, language)
    if year_hits:
        return _join_sentences(year_hits[:2], language=language)

    if site and site.get("year_inscribed"):
        listing = _heritage_listing_answer(site, language)
        if listing:
            lang = _normalize_language(language)
            if lang == "en":
                return (
                    f"{listing} Our local sources also describe historical activity at the site "
                    "over a longer period."
                )
            return (
                f"{listing} I våra lokala källor beskrivs också att platsen har en lång historia."
            )

    return _summary_from_context(context, language=language)


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
        return _summary_from_context(context, language=language)
    return None


def _heritage_site_context(site_id: int | str, language: str) -> tuple[str, list[str]]:
    site = find_site_by_ref(str(site_id))
    if not site:
        return "", []

    lang = _normalize_language(language)
    parts: list[str] = []
    sources: list[str] = []

    year = (site.get("year_inscribed") or "").strip()
    country = (site.get("country") or "").strip()
    category = (site.get("category") or "").strip()

    if lang == "en":
        name = (site.get("name") or "").strip()
        if name:
            parts.append(name)
        if year:
            parts.append(f"Inscribed as UNESCO World Heritage in {year}.")
        if country:
            parts.append(f"Country: {country}.")
        if category:
            parts.append(f"Category: {category}.")
    else:
        if year:
            parts.append(f"UNESCO världsarv sedan {year}.")
        if country:
            country_display = _COUNTRY_SV.get(country, country)
            parts.append(f"Land: {country_display}.")
        if category:
            category_display = _CATEGORY_SV.get(category, category)
            parts.append(f"Kategori: {category_display}.")

    description, source_key = _pick_site_description(site, lang)
    if description:
        parts.append(description)
        sources.append(f"heritage-sites.json ({source_key})")

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
    sentences = _filter_sentences_for_language(_split_sentences(context), language)

    if not words:
        intent_answer = _answer_by_intent(question, site, context, language)
        if intent_answer:
            return intent_answer, sources, False
        return _pick_language_fallback(language, "we_return"), sources, True

    scored = [(s, _score_sentence(s, words)) for s in sentences]
    hits = [s for s, score in scored if score >= _MIN_MATCH_SCORE]
    hits = _filter_sentences_for_language(hits, language)
    hits.sort(key=lambda s: _score_sentence(s, words), reverse=True)

    if hits:
        answer = _join_sentences(hits[:3], language=language)
        return answer, sources, False

    intent_answer = _answer_by_intent(question, site, context, language)
    if intent_answer:
        return intent_answer, sources, False

    if _is_off_topic_question(question):
        return _pick_language_fallback(language, "we_return"), sources, True

    if context.strip():
        return _summary_from_context(context, language=language), sources, False

    return _pick_language_fallback(language, "no_info"), sources, False
