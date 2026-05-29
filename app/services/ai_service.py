"""
AI Service – svar enbart från lokala UNESCO-källor (PDF/txt), inte internet.
"""
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.other import AIDocument
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


def search_documents(db: Optional[Session], site_id: int, question: str) -> List[AIDocument]:
    if db is None:
        return []
    try:
        return db.query(AIDocument).filter(AIDocument.site_id == site_id).all()
    except Exception:
        return []


def _question_words(question: str) -> list[str]:
    return [w.lower() for w in question.split() if len(w) > _MIN_QUESTION_WORD_LEN]


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
        return _pick_language_fallback(language, "we_return"), sources, True

    scored = [(s, _score_sentence(s, words)) for s in sentences]
    hits = [s for s, score in scored if score >= _MIN_MATCH_SCORE]
    hits.sort(key=lambda s: _score_sentence(s, words), reverse=True)

    if hits:
        answer = ". ".join(hits[:3])
        if not answer.endswith("."):
            answer += "."
        return answer, sources, False

    # Källor finns men frågan matchar inte tillräckligt – kundens "vi återkommer"
    if context.strip():
        return _pick_language_fallback(language, "we_return"), sources, True

    return _pick_language_fallback(language, "no_info"), sources, False
