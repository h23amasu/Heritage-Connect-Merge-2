"""
AI Service – svar enbart från lokala UNESCO-källor (PDF/txt), inte internet.
"""
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
        "hur",
        "när",
        "where",
        "when",
        "which",
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


def _summary_from_context(context: str, max_sentences: int = 3) -> str:
    sentences = [
        s.strip()
        for s in context.replace("\n", " ").split(".")
        if s.strip() and len(s.strip()) > 20
    ]
    if not sentences:
        trimmed = context.strip()
        return trimmed[:600] + ("…" if len(trimmed) > 600 else "")
    answer = ". ".join(sentences[:max_sentences])
    if not answer.endswith("."):
        answer += "."
    return answer


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

    context = "\n\n".join(context_parts)
    words = _question_words(question)
    sentences = [
        s.strip()
        for s in context.replace("\n", " ").split(".")
        if s.strip() and len(s.strip()) > 20
    ]

    if not words:
        if _is_generic_site_question(question):
            return _summary_from_context(context), sources, False
        return _pick_language_fallback(language, "we_return"), sources, True

    scored = [(s, _score_sentence(s, words)) for s in sentences]
    hits = [s for s, score in scored if score >= _MIN_MATCH_SCORE]
    hits.sort(key=lambda s: _score_sentence(s, words), reverse=True)

    if hits:
        answer = ". ".join(hits[:3])
        if not answer.endswith("."):
            answer += "."
        return answer, sources, False

    if _is_generic_site_question(question):
        return _summary_from_context(context), sources, False

    # Källor finns men frågan matchar inte tillräckligt – kundens "vi återkommer"
    if context.strip():
        return _pick_language_fallback(language, "we_return"), sources, True

    return _pick_language_fallback(language, "no_info"), sources, False
