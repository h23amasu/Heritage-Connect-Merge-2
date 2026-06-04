"""
AI Service – svar enbart från lokala UNESCO-källor (PDF/txt), inte internet.

Läser hela frågan (intent först), svarar sedan utifrån källor utan gissning.
Med AI_PROVIDER=openai och OPENAI_API_KEY formuleras svaret naturligt men
enbart utifrån samma lokala kontext.
"""
from __future__ import annotations

import logging
import re
from functools import lru_cache
from difflib import SequenceMatcher
from enum import Enum
from typing import List, Optional, Tuple

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.other import AIDocument
from app.services.heritage_sites_local import find_site_by_ref
from app.services.pdf_loader import load_local_documents
from app.services.translate_service import translate_text
from app.services.whc_descriptions import combined_ai_context_text, get_whc_extended_texts

logger = logging.getLogger(__name__)

# UNESCO:s sex officiella språk + svenska (lokal tidning)
UNESCO_OFFICIAL_LANGUAGES = frozenset({"en", "fr", "es", "ar", "ru", "zh"})
UNESCO_AI_LANGUAGES = UNESCO_OFFICIAL_LANGUAGES | {"sv"}

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
_FALLBACK_NO_INFO_BY_LANG: dict[str, str] = {
    "sv": FALLBACK_NO_INFO_SV,
    "en": FALLBACK_NO_INFO_EN,
    "fi": (
        "En löytänyt selkeää vastausta kysymykseesi paikallisista lähteistä. "
        "Kokeile muotoilla uudelleen sanoin, jotka esiintyvät kuvauksessa, "
        "tai kysy milloin kohde listattiin UNESCO-maailmanperinnöksi."
    ),
    "de": (
        "Ich habe in den lokalen Quellen keine klare Antwort auf Ihre Frage gefunden. "
        "Formulieren Sie die Frage z. B. mit Wörtern aus der Beschreibung, "
        "oder fragen Sie, wann die Stätte als UNESCO-Welterbe eingetragen wurde."
    ),
    "fr": (
        "Je n’ai pas trouvé de réponse claire à votre question dans les sources locales. "
        "Reformulez avec des mots de la description, "
        "ou demandez quand le site a été inscrit au patrimoine mondial de l’UNESCO."
    ),
    "es": (
        "No encontré una respuesta clara en las fuentes locales. "
        "Reformule usando palabras de la descripción, "
        "o pregunte cuándo el sitio fue inscrito como Patrimonio Mundial de la UNESCO."
    ),
    "ar": (
        "لم أجد إجابة واضحة في المصادر المحلية. "
        "أعد صياغة السؤال بكلمات من وصف الموقع، "
        "أو اسأل متى أُدرج الموقع في قائمة التراث العالمي لليونسكو."
    ),
    "ru": (
        "Я не нашёл ясного ответа на ваш вопрос в локальных источниках. "
        "Переформулируйте вопрос словами из описания объекта "
        "или спросите, когда объект был включён в список всемирного наследия ЮНЕСКО."
    ),
    "zh": (
        "我在本地资料中没有找到明确答案。"
        "请用描述中的词语重新提问，"
        "或询问该遗产何时列入联合国教科文组织世界遗产名录。"
    ),
    "it": (
        "Non ho trovato una risposta chiara alle tue domande nelle fonti locali. "
        "Prova a riformulare con parole dalla descrizione del sito, "
        "oppure chiedi quando il sito è diventato patrimonio mondiale UNESCO."
    ),
}
_FALLBACK_WE_RETURN_BY_LANG: dict[str, str] = {
    "sv": FALLBACK_WE_RETURN_SV,
    "en": FALLBACK_WE_RETURN_EN,
    "fi": "Tähän kysymykseen ei voi vastata maailmanperintölähteistä. Kysy uudestaan itse paikasta.",
    "de": "Diese Frage lässt sich nicht aus den Welterbe-Quellen beantworten. Stellen Sie eine neue Frage zum Ort.",
    "fr": "Cette question ne peut pas être répondue à partir des sources du patrimoine. Posez une question sur le site.",
    "es": "No podemos responder desde las fuentes del patrimonio. Haga una nueva pregunta sobre el sitio.",
    "ar": "لا يمكن الإجابة على هذا السؤال من مصادر التراث. اطرح سؤالاً جديداً عن الموقع نفسه.",
    "ru": "На этот вопрос нельзя ответить по источникам всемирного наследия. Задайте новый вопрос о самом объекте.",
    "zh": "无法根据世界遗产资料回答该问题。请重新提问，且问题需与这处遗产本身相关。",
    "it": "Questa domanda non può essere risposta con le fonti del patrimonio. Fai una nuova domanda sul sito.",
}

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
        "har",
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
        "unesco",
        "vÃ¤rldsarv",
        "varldsarv",
        "heritage",
        "world",
        "property",
        "place",
        "plats",
        "platsen",
        "stÃ¤llet",
        "objektet",
        "vilken",
        "vilket",
        "vilka",
        "hur",
        "inom",
        "how",
        "why",
        "varför",
        "vad",
        "what",
        "är",
        "is",
        "are",
        "was",
        "were",
        "vem",
        "who",
        "vilken",
        "vilket",
        "vilka",
        "which",
        "berätta",
        "tell",
        "beskriv",
        "describe",
        "förklara",
        "explain",
        "säger",
        "säga",
        "källorna",
        "källan",
        "sources",
        "källor",
        "kan",
        "inte",
        "kommer",
        "the",
        "and",
        "och",
        "site",
        "say",
        "säger",
        "was",
        "ist",
        "sind",
        "wie",
        "warum",
        "wo",
        "wer",
        "que",
        "quoi",
        "qué",
        "comment",
        "pourquoi",
        "où",
        "qui",
        "mitä",
        "mikä",
        "miksi",
        "missä",
        "milloin",
        "che",
        "cosa",
        "come",
        "perché",
        "dove",
        "hva",
        "hvad",
        "hvor",
        "hvorfor",
        "hvem",
        "når",
        "hvornår",
        "por",
        "para",
        "como",
        "porqué",
        "dónde",
        "quien",
        "cuando",
        "dónde",
        "donde",
        "cuál",
        "cual",
        # ryska
        "что",
        "как",
        "где",
        "когда",
        "почему",
        "кто",
        "это",
        "эта",
        "какой",
        # arabiska (vanliga frågeord)
        "ماذا",
        "ما",
        "أين",
        "متى",
        "كيف",
        "لماذا",
        "من",
        "هو",
        "هي",
        # kinesiska
        "什么",
        "是什么",
        "哪里",
        "何时",
        "为什么",
        "怎么",
        "哪个",
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
    "maailmanperintö",
    "maailmanperinto",
    "welterbe",
    "patrimoine mondial",
    "patrimonio mundial",
    "patrimonio",
    "world heritage list",
    "världsarvslistan",
    "patrimoine mondial de l'unesco",
    "patrimonio mundial de la humanidad",
    "تراث عالمي",
    "التراث العالمي",
    "世界遗产",
    "世界文化遗产",
    "всемирное наследие",
    "юнеско",
    "unesco",
    "patrimonio mondiale",
    "patrimonio dell'umanità",
    "patrimonio mondiale unesco",
    "diventato patrimonio",
    "è diventato patrimonio",
)
_SIGNIFICANCE_HINTS = (
    "unikt",
    "unique",
    "unico",
    "unica",
    "einzigartig",
    "exceptional",
    "outstanding",
    "särskilt",
    "speciellt",
    "important",
    "viktigt",
    "significance",
    "signifikans",
    "varför är",
    "why is",
    "why was",
    "perché",
    "pourquoi",
    "warum",
    "cosa rende",
    "what makes",
    "vad gör",
    "qué hace",
    "vad är unikt",
    "what is unique",
    "cosa è unico",
)
_AREA_QUESTION_RE = re.compile(
    r"\b(?:"
    r"yta|ytan|area|storlek|size|hectare|hektar|hectares|"
    r"hur stor|hur stort|how (?:big|large)|fläche|superficie|"
    r"quanto è grande|surface|acreage"
    r")\b",
    re.IGNORECASE,
)
_AREA_FACT_RE = re.compile(
    r"(?:"
    r"current area of the inscribed property is|"
    r"area of the inscribed property is|"
    r"the inscribed property is|"
    r"nuvarande yta|inskrivna fastighetens nuvarande yta|"
    r"current area of the property is"
    r")[^.]{0,120}?(\d[\d\s.,]*\s*ha)",
    re.IGNORECASE,
)
_SIGNIFICANCE_CONTEXT_TERMS = (
    "outstanding",
    "universal",
    "exceptional",
    "symbol",
    "unique",
    "greatest",
    "embodiment",
    "masterpiece",
    "criterion",
    "integrity",
    "authenticity",
    "unesco",
    "world heritage",
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
    "wann",
    "quand",
    "cuando",
    "cuándo",
    "milloin",
    "hvornår",
    "år",
    "year",
    "jahr",
    "anno",
    "datum",
    "date",
    "sedan",
    "since",
    "когда",
    "متى",
    "何时",
    "année",
    "año",
)
_SITE_LOCATION_PHRASES = (
    "var ligger",
    "where is it",
    "where is this",
    "where is the",
    "wo liegt",
    "où se trouve",
    "ou se trouve",
    "dónde está",
    "donde esta",
    "missä sijaitsee",
    "missä on",
    "hvor ligger",
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
    "أين يقع",
    "أين تقع",
    "где находится",
    "在哪里",
    "位於哪裡",
    "où se trouve",
    "dónde se encuentra",
)
_WHAT_IS_QUESTION = re.compile(
    r"^(?:"
    r"vad|what|was|ist|sind|est|es|son|"
    r"qu['']?est[- ]ce que|que es|qué es|"
    r"mikä on|mitä on|mikä|"
    r"hva er|hvad er|"
    r"cos['']?è|che cosa è|"
    r"что такое|что это|"
    r"ما هو|ما هي|"
    r"什么是|是什么"
    r")\s*",
    re.IGNORECASE,
)
_INTRO_VERB = re.compile(
    r"^(?:är|is|are|est|es|son|on|er|sind|êtes?|è|есть|هو|هي|是)\s*",
    re.IGNORECASE,
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


_QUESTION_LANGUAGE_MARKERS: dict[str, tuple[str, ...]] = {
    "sv": (
        "vad",
        "när",
        "var",
        "vilken",
        "vilka",
        "hur",
        "finns",
        "världsarv",
        "platsen",
        "från",
        "inom",
    ),
    "en": (
        "what",
        "when",
        "where",
        "which",
        "how",
        "does",
        "there",
        "site",
        "within",
        "finds",
        "date",
        "from",
    ),
    "it": (
        "che",
        "cosa",
        "quale",
        "quali",
        "quando",
        "dove",
        "sono",
        "sito",
        "reperti",
        "periodo",
        "scoperto",
        "ricercatori",
    ),
    "fr": (
        "quel",
        "quelle",
        "quelles",
        "quand",
        "où",
        "site",
        "découvert",
        "trouvailles",
    ),
    "es": (
        "qué",
        "que",
        "cuándo",
        "dónde",
        "sitio",
        "hallazgos",
        "descubierto",
    ),
    "de": (
        "was",
        "wann",
        "wo",
        "welche",
        "welcher",
        "funde",
        "stätte",
        "entdeckt",
    ),
    "fi": (
        "mitä",
        "milloin",
        "missä",
        "mikä",
        "kuinka",
        "löydöt",
        "alueella",
    ),
}

_YES_PREFIX_BY_LANG: dict[str, str] = {
    "sv": "Ja,",
    "en": "Yes,",
    "it": "Sì,",
    "fr": "Oui,",
    "es": "Sí,",
    "de": "Ja,",
    "fi": "Kyllä,",
    "no": "Ja,",
    "da": "Ja,",
    "ru": "Да,",
    "ar": "نعم،",
    "zh": "是的，",
}

_YES_EVIDENCE_BY_LANG: dict[str, str] = {
    "sv": "Ja, det finns bevis för det.",
    "en": "Yes, there is evidence of that.",
    "it": "Sì, ci sono prove di questo.",
    "fr": "Oui, il existe des preuves de cela.",
    "es": "Sí, hay pruebas de ello.",
    "de": "Ja, dafür gibt es Belege.",
}

def _infer_question_language(question: str, fallback: str = "sv") -> str:
    raw = (question or "").strip()
    if not raw:
        return _normalize_language(fallback)

    if re.search(r"[\u4e00-\u9fff]", raw):
        return "zh"
    if re.search(r"[\u0600-\u06ff]", raw):
        return "ar"
    if re.search(r"[\u0400-\u04ff]", raw):
        return "ru"
    if re.search(r"^(?:what|when|where|which|how|why|is|are|was|were|do|does|did|has|have|had|can|could|from)\b", raw.lower()):
        return "en"
    if re.search(r"^(?:che|cosa|quale|quali|quando|dove|è|ha|ci\s+sono)\b", raw.lower()):
        return "it"

    lower = raw.lower()
    scores: dict[str, int] = {}
    for lang, markers in _QUESTION_LANGUAGE_MARKERS.items():
        score = sum(1 for marker in markers if marker in lower)
        if score:
            scores[lang] = score

    if not scores:
        return _normalize_language(fallback)

    best_lang, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score < 2:
        return _normalize_language(fallback)
    return best_lang


def _site_display_name(site: dict, language: str) -> str:
    lang = _normalize_language(language)
    for key in (f"name_{lang}", "name", "name_sv", "name_en"):
        value = (site.get(key) or "").strip()
        if value:
            return value
    return ""


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
    if lang == "sv":
        return swedish_hits - english_hits
    return english_hits


def _context_match_language(language: str) -> str:
    """UNESCO WHC-långtext är på engelska – matcha frågor mot den."""
    return "en"


def _is_unesco_language(language: str) -> bool:
    return _normalize_language(language) in UNESCO_AI_LANGUAGES


def _answer_source_language(text: str, target_language: str) -> str:
    """Avgör källspråk för citat innan översättning till läsarens språk."""
    target = _normalize_language(target_language)
    if target == "en" or _looks_english(text):
        return "en"
    if target in UNESCO_OFFICIAL_LANGUAGES:
        return target
    return "en"


def _filter_sentences_for_language(sentences: list[str], language: str) -> list[str]:
    if not sentences:
        return sentences
    match_lang = _context_match_language(language)
    preferred = [
        sentence
        for sentence in sentences
        if _language_score(sentence, match_lang) >= 0
    ]
    return preferred or sentences


def _looks_english(text: str) -> bool:
    return len(_EN_WORDS.findall(text)) >= 2


def _localize_answer(text: str, source_lang: str, target_lang: str) -> str:
    """Översätt källcitat till läsarens språk när det behövs."""
    trimmed = (text or "").strip()
    if not trimmed:
        return ""
    source = _normalize_language(source_lang)
    target = _normalize_language(target_lang)
    if source == target:
        return trimmed
    if target == "en" and _looks_english(trimmed):
        return trimmed
    if len(trimmed) > 4000:
        trimmed = trimmed[:4000].rsplit(".", 1)[0] + "."
    translated = translate_text(trimmed, source, target)
    return translated if translated and translated.strip() else trimmed


def _pick_site_description(site: dict, language: str) -> tuple[str, str]:
    lang = _normalize_language(language)
    localized_key = f"desc_{lang}"
    localized = (site.get(localized_key) or "").strip()
    desc_en = (site.get("desc_en") or site.get("description") or "").strip()

    if lang in UNESCO_OFFICIAL_LANGUAGES and localized:
        return localized, localized_key

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


def _token_min_length(token: str) -> int:
    if re.search(r"[\u0600-\u06ff\u4e00-\u9fff\u0400-\u04ff]", token):
        return 2
    return _MIN_QUESTION_WORD_LEN


def _question_tokens(question: str) -> list[str]:
    raw = (question or "").strip()
    lower = raw.lower()
    tokens: list[str] = []
    seen: set[str] = set()
    for part in re.findall(r"[^\W\d_]+", lower, flags=re.UNICODE):
        if part not in seen:
            tokens.append(part)
            seen.add(part)
    for part in re.findall(r"[\u4e00-\u9fff]{2,}", raw):
        if part not in seen:
            tokens.append(part)
            seen.add(part)
    for part in re.findall(r"[\u0600-\u06ff]{2,}", raw):
        if part not in seen:
            tokens.append(part)
            seen.add(part)
    return tokens


def _question_words(question: str) -> list[str]:
    return [
        w
        for w in _question_tokens(question)
        if len(w) >= _token_min_length(w) and w not in _QUESTION_STOP_WORDS
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
    text = re.sub(r"\s+", " ", (context or "").replace("\n", " ")).strip()
    if not text:
        return []
    protected = re.sub(r"(\d)\.(\d)", r"\1<DECIMAL>\2", text)
    results: list[str] = []
    for part in protected.split("."):
        piece = part.replace("<DECIMAL>", ".").strip()
        if len(piece) >= 20:
            results.append(piece)
    return results


def _clean_citation_unit(text: str) -> str:
    cleaned = re.sub(r"^[\s.\n\r]+", "", (text or "").strip())
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def _asks_property_area_or_size(question: str) -> bool:
    return bool(_AREA_QUESTION_RE.search(question or ""))


def _asks_discoveries_or_finds(question: str) -> bool:
    q = (question or "").lower()
    return bool(
        re.search(
            r"\b(uppt[aä]ckt|uppt[aä]ckts|fynd|fynden|hittat|hittats|"
            r"discover(?:ed|ies)?|found|findings|fossils?|remains?|artifacts?|"
            r"excavations?|utgr[aä]vningar?)\b",
            q,
        )
    )


def _asks_time_period(question: str) -> bool:
    q = (question or "").lower()
    return bool(
        re.search(
            r"\b(tidsperiod|period|fr[aå]n vilken tid|vilken tid|n[aä]r|"
            r"when|time period|from what time|how old|dated?|date from|"
            r"bce|ce|century|million|years? ago|paleolithic|pleistocene)\b",
            q,
        )
    )


def _asks_quantity(question: str) -> bool:
    q = (question or "").lower()
    return bool(
        re.search(
            r"\b(hur m[aå]nga|antal|how many|number of|several|many|count)\b",
            q,
        )
    )


def _asks_yes_no(question: str) -> bool:
    q = (question or "").strip().lower()
    if not q:
        return False
    return bool(
        re.search(
            r"^(?:finns|är|har|kan|var|visar|does|do|did|is|are|was|were|"
            r"has|have|had|can|could|ci\s+sono|c['’]è|è|ha|sono|est-ce|"
            r"y a-t-il|hay|es|gibt|ist|sind|onko|voiko)\b",
            q,
        )
    )


def _extract_area_fact_sentence(context: str) -> str:
    """Hitta mening om inskriven yta (t.ex. 162.429 ha) i UNESCO-texten."""
    text = (context or "").replace("\n", " ")
    match = _AREA_FACT_RE.search(text)
    if match:
        start = max(0, text.rfind(".", 0, match.start()) + 1)
        end = text.find(".", match.end())
        if end == -1:
            end = min(len(text), match.end() + 120)
        return _clean_citation_unit(text[start:end])

    for unit in _split_sentences(text):
        lower = unit.lower()
        if "ha" in lower and any(
            token in lower
            for token in ("area", "property", "inscribed", "yta", "fastighet", "nuvarande")
        ):
            if re.search(r"\d[\d\s.,]*\s*ha", unit, re.IGNORECASE):
                return _clean_citation_unit(unit)
    return ""


def _format_area_amount(raw: str) -> str:
    return re.sub(r"\s+", " ", (raw or "").replace(".", " ").strip())


def _answer_property_area_from_context(context: str, language: str) -> str:
    sentence = _extract_area_fact_sentence(context)
    if not sentence:
        return ""
    match = re.search(r"(\d[\d\s.,]+)\s*ha", sentence, re.IGNORECASE)
    if match:
        amount = _format_area_amount(match.group(1))
        lang = _normalize_language(language)
        if lang == "sv":
            return f"Den inskrivna fastighetens nuvarande yta är {amount} ha."
        if lang == "it":
            return (
                f"L'area attuale della proprietà iscritta è di {amount} ha."
            )
        if lang == "en":
            return f"The current area of the inscribed property is {amount} ha."
    return _localize_answer(sentence, "en", language)


def _iter_search_units(context: str) -> list[str]:
    """Delar upp långa UNESCO-avsnitt så fler meningar kan matchas mot frågan."""
    units: list[str] = []
    for chunk in _split_context_chunks(context):
        if len(chunk) > 700:
            units.extend(_split_sentences(chunk))
        elif len(chunk) > 20:
            units.append(chunk)
    if not units:
        units = _split_sentences(context)
    cleaned: list[str] = []
    seen: set[str] = set()
    for unit in units:
        normalized = _clean_citation_unit(unit)
        if len(normalized) < 25:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(normalized)
    return cleaned


def _asks_uniqueness_or_significance(question: str) -> bool:
    q = (question or "").strip().lower()
    if not q:
        return False
    if any(h in q for h in _SIGNIFICANCE_HINTS):
        return True
    return bool(
        re.search(
            r"\b(vad|what|cosa|qu['']?est|qué|mitä|was|che)\b.+(unikt|unique|unico|important|significant|speciell)",
            q,
        )
    )


@lru_cache(maxsize=256)
def _translate_question_for_search(question: str, language: str) -> str:
    lang = _normalize_language(language)
    trimmed = (question or "").strip()[:400]
    if not trimmed or lang == "en":
        return trimmed
    translated = translate_text(trimmed, lang, "en")
    return translated if translated and translated.strip() else trimmed


def _retrieval_terms(
    question: str, language: str, site: Optional[dict] = None
) -> list[str]:
    terms: list[str] = []
    seen: set[str] = set()
    for word in _question_words(question):
        if word not in seen:
            terms.append(word)
            seen.add(word)
    lang = _normalize_language(language)
    if lang != "en":
        for word in _question_words(_translate_question_for_search(question, lang)):
            if word not in seen:
                terms.append(word)
                seen.add(word)
    return terms


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
    normalized = [_clean_citation_unit(s) for s in sentences if _clean_citation_unit(s)]
    filtered = _filter_sentences_for_language(normalized, language)
    if not filtered:
        return ""
    selected = filtered[:max_sentences]
    if any(len(s) > 220 for s in selected):
        raw = "\n\n".join(selected)
    else:
        raw = ". ".join(selected)
        if not raw.endswith("."):
            raw += "."
    source_lang = _answer_source_language(raw, language)
    return _localize_answer(raw, source_lang, language)


def _localize_yes_prefix(language: str) -> str:
    lang = _normalize_language(language)
    return _YES_PREFIX_BY_LANG.get(lang, _YES_PREFIX_BY_LANG["en"])


def _localize_yes_evidence(language: str) -> str:
    lang = _normalize_language(language)
    return _YES_EVIDENCE_BY_LANG.get(lang, _YES_EVIDENCE_BY_LANG["en"])


def _format_yes_no_answer(question: str, answer: str, language: str) -> str:
    text = (answer or "").strip()
    if not text or not _asks_yes_no(question):
        return text
    if re.match(r"^(ja|yes|oui|sí|si|sì|kyllä|да|نعم|是的)\b", text, re.IGNORECASE):
        return text
    if re.search(r"\b(spår|bevis|evidence|proof|signs?)\b", (question or "").lower()):
        return f"{_localize_yes_evidence(language)} {text}".strip()
    if re.match(r"^samtidigt\s+har\b", text, re.IGNORECASE):
        text = re.sub(r"^samtidigt\s+har\b", "Det har", text, flags=re.IGNORECASE)
    if re.match(r"^at the same time,\s*", text, re.IGNORECASE):
        text = re.sub(r"^at the same time,\s*", "", text, flags=re.IGNORECASE)
    return f"{_localize_yes_prefix(language)} {text}".strip()


def _heritage_listing_answer(site: dict, language: str) -> str:
    year = (site.get("year_inscribed") or "").strip()
    if not year:
        return ""
    name = _site_display_name(site, language) or _site_display_name(site, "en")
    lang = _normalize_language(language)
    if lang == "en":
        if name:
            return f"{name} was inscribed as a UNESCO World Heritage Site in {year}."
        return f"It was inscribed as a UNESCO World Heritage Site in {year}."
    if lang == "sv":
        if name:
            return f"{name} blev UNESCO-världsarv {year}."
        return f"Platsen blev UNESCO-världsarv {year}."
    if lang == "fr" and name:
        return f"{name} a été inscrit au patrimoine mondial de l’UNESCO en {year}."
    if lang == "es" and name:
        return f"{name} fue inscrito como Patrimonio Mundial de la UNESCO en {year}."
    if lang == "ar" and name:
        base = f"أُدرج {name} في قائمة التراث العالمي لليونسكو عام {year}."
        return base
    if lang == "ru" and name:
        return f"{name} был включён в список всемирного наследия ЮНЕСКО в {year} году."
    if lang == "zh" and name:
        return f"{name}于{year}年列入联合国教科文组织世界遗产名录。"
    if lang == "it" and name:
        return f"{name} è stato iscritto nella lista del patrimonio mondiale UNESCO nel {year}."
    if lang == "it":
        return f"Il sito è stato iscritto nella lista del patrimonio mondiale UNESCO nel {year}."
    en = (
        f"{name} was inscribed as a UNESCO World Heritage Site in {year}."
        if name
        else f"It was inscribed as a UNESCO World Heritage Site in {year}."
    )
    return _localize_answer(en, "en", lang)


def _location_answer(site: dict, language: str) -> str:
    country = (site.get("country") or "").strip()
    name = _site_display_name(site, language) or _site_display_name(site, "en")
    if not country and not name:
        return ""
    lang = _normalize_language(language)
    if lang == "en":
        if name and country:
            return f"{name} is located in {country}."
        return f"The site is located in {country}." if country else name
    if lang == "sv":
        country_display = _COUNTRY_SV.get(country, country)
        if name and country_display:
            return f"{name} ligger i {country_display}."
        return f"Platsen ligger i {country_display}." if country_display else ""
    en = (
        f"{name} is located in {country}."
        if name and country
        else (f"The site is located in {country}." if country else name)
    )
    return _localize_answer(en, "en", lang)


def _category_answer(site: dict, language: str) -> str:
    category = (site.get("category") or "").strip()
    if not category:
        return ""
    name = _site_display_name(site, language) or _site_display_name(site, "en")
    lang = _normalize_language(language)
    if lang == "en":
        if name:
            return f"{name} is listed as a {category} World Heritage property."
        return f"The site is listed as a {category} World Heritage property."
    if lang == "sv":
        display = _CATEGORY_SV.get(category, category)
        if name:
            return f"{name} är klassad som {display} världsarv."
        return f"Platsen är klassad som {display} världsarv."
    en = (
        f"{name} is listed as a {category} World Heritage property."
        if name
        else f"The site is listed as a {category} World Heritage property."
    )
    return _localize_answer(en, "en", lang)


def _asks_creation_without_listing(question: str) -> bool:
    """'När skapades' utan UNESCO-listning – ska inte plocka årtal ur brödtext."""
    q = (question or "").lower()
    raw = question or ""
    has_creation = any(h in q for h in _CREATION_HINTS)
    has_listing = any(h in q or h in raw for h in _LISTING_YEAR_HINTS)
    return has_creation and not has_listing


def _asks_listing_year(question: str) -> bool:
    q = question.lower()
    raw = question or ""
    has_temporal = any(h in q or h in raw for h in _TEMPORAL_HINTS)
    has_listing = any(h in q or h in raw for h in _LISTING_YEAR_HINTS)
    has_creation = any(h in q for h in _CREATION_HINTS)
    if has_creation and not has_listing:
        return False
    if has_temporal and has_listing:
        return True
    if "何时" in raw and ("世界遗产" in raw or "遗产" in raw or "unesco" in q):
        return True
    if "когда" in q and (
        "unesco" in q or "всемирное наследие" in q or "наследия" in q or "юнеско" in q
    ):
        return True
    if "متى" in raw and (
        "unesco" in q or "تراث" in raw or "اليونسكو" in raw or "اليونسكو" in q
    ):
        return True
    return False


def _asks_country(question: str) -> bool:
    if _is_personal_question(question):
        return False
    raw = question or ""
    q = raw.lower()
    if any(h in q for h in _LISTING_YEAR_HINTS + _CREATION_HINTS):
        return False
    if any(phrase in q for phrase in _SITE_LOCATION_PHRASES):
        return True
    return bool(
        re.search(r"\bvar\s+ligger\s+(det|den|platsen|detta|site)\b", q)
        or re.search(r"\bwhere\s+(is|are)\s+(it|this|the)\b", q)
        or re.search(r"\bwo\s+liegt\b", q)
        or re.search(r"\boù\s+se\s+trouve\b", q)
        or re.search(r"\bmissä\s+(sijaitsee|on)\b", q)
        or re.search(r"\bdónde\s+está\b", q)
        or re.search(r"\bwo\s+ist\b", q)
        or "где находится" in q
        or "أين يقع" in raw
        or "أين تقع" in raw
        or "在哪里" in raw
        or "位於哪裡" in raw
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
    if description and not whc_text:
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


def _question_answer_bonus(sentence: str, question: str) -> float:
    lower = sentence.lower()
    bonus = 0.0

    if _asks_discoveries_or_finds(question):
        if re.search(
            r"\b(discover(?:ed|ies)?|found|findings|fossils?|remains?|artifacts?|"
            r"excavations?|scientists?|researchers?|hominid|animal fossils?|"
            r"stone tools?|cultural remains?)\b",
            lower,
        ):
            bonus += 2.5
        if re.search(r"\bscientists?|researchers?\b", lower) and re.search(
            r"\bdiscover(?:ed|ies)?\b",
            lower,
        ):
            bonus += 1.5

    if _asks_time_period(question):
        if re.search(
            r"\b(\d[\d,.\s]*\s*(?:years?|year|million|thousand|centur(?:y|ies)|ha)|"
            r"bce|ce|paleolithic|pleistocene|dynasty)\b",
            lower,
        ):
            bonus += 2.0
        if re.search(
            r"\b\d[\d,.\s]*\s*(?:million|thousand|years?)\s+ago\b.*\b\d[\d,.\s]*\s*(?:million|thousand|years?)\s+ago\b",
            lower,
        ):
            bonus += 4.0

    if _asks_quantity(question):
        if re.search(r"\b\d[\d,.\s]*\b", lower):
            bonus += 1.5
        if re.search(r"\b\d[\d,.\s]*\s+(?:sites?|places?)\b", lower):
            bonus += 3.0

    return bonus


def _sentence_relevance(sentence: str, question: str, words: list[str]) -> float:
    """Hela frågan vägs in (likhet + nyckelord), inte bara enstaka ord."""
    word_score = float(_score_sentence(sentence, words))
    q_norm = re.sub(r"\s+", " ", (question or "").lower().strip())
    similarity = SequenceMatcher(None, q_norm, sentence.lower()).ratio()
    return word_score * 2.0 + similarity + _question_answer_bonus(sentence, question)


def _direct_fact_answer(
    question: str, context: str, language: str, site: Optional[dict] = None
) -> str:
    probe_question = question
    translated_question = _translate_question_for_search(question, language)
    if translated_question and translated_question.strip():
        probe_question = f"{question} {translated_question}".strip()

    if not (
        _asks_discoveries_or_finds(probe_question)
        or _asks_time_period(probe_question)
        or _asks_quantity(probe_question)
    ):
        return ""

    terms = _retrieval_terms(question, language, site=site)
    units = _filter_sentences_for_language(_iter_search_units(context), language)
    if not units:
        return ""

    ranked = sorted(
        units,
        key=lambda s: (
            _question_answer_bonus(s, probe_question),
            _sentence_relevance(s, probe_question, terms),
            -len(s),
        ),
        reverse=True,
    )
    top = [s for s in ranked if _question_answer_bonus(s, probe_question) > 0][:2]
    if not top:
        return ""
    return _join_sentences(top, max_sentences=2, language=language)


_INTRO_VAGUE_SUBJECTS = frozenset(
    {
        "i",
        "in",
        "om",
        "about",
        "de",
        "des",
        "du",
        "di",
        "del",
        "sobre",
        "su",
        "uber",
        "unikt",
        "unique",
        "detta",
        "denna",
        "dette",
        "platsen",
        "site",
        "världsarv",
        "heritage",
        "viktigt",
        "important",
        "särskilt",
        "special",
        "det",
        "den",
        "it",
        "this",
        "that",
    }
)


def _extract_intro_subject(question: str) -> str:
    q = (question or "").strip().lower()
    if not q:
        return ""
    if _WHAT_IS_QUESTION.match(q):
        rest = _WHAT_IS_QUESTION.sub("", q).strip()
        rest = _INTRO_VERB.sub("", rest).strip()
        rest = re.sub(r"^(?:the|det|den|das|la|el|les?)\s+", "", rest)
        match = re.match(r"^([\wåäö-]+)", rest)
        return match.group(1) if match else ""
    tell = re.search(
        r"^(?:berätta|beskriv|förklara|tell|describe|explain|raconte|erzähl|"
        r"kerro|kuva|explica|expliquer)\s+(?:om\s+|about\s+|de\s+|über\s+)?([\wåäö-]+)",
        q,
    )
    return tell.group(1) if tell else ""


def _asks_site_intro(question: str) -> bool:
    """'Vad är Grimeton?' / 'Qu'est-ce que Grimeton?' – introduktion om platsen."""
    q = (question or "").strip().lower()
    if not q:
        return False
    vague_phrases = (
        "vad är det",
        "vad är detta",
        "what is this",
        "what is it",
        "qu'est-ce que c'est",
        "que es esto",
        "mitä tämä on",
    )
    if q in vague_phrases:
        return False

    subject = _extract_intro_subject(question)
    if subject:
        return subject not in _INTRO_VAGUE_SUBJECTS

    return bool(
        re.search(
            r"^(?:berätta|beskriv|förklara|tell|describe|explain|raconte|erzähl|"
            r"kerro|explica|expliquer)\s+",
            q,
        )
    )


def _intro_from_context(
    context: str, language: str, site: Optional[dict] = None
) -> str:
    """Första meningsfulla avsnittet – helst på läsarens språk."""
    lang = _normalize_language(language)
    if site:
        localized, _ = _pick_site_description(site, lang)
        if localized and len(localized) >= 40:
            parts = _split_context_chunks(localized) or [localized]
            joined = _join_sentences(parts[:2], max_sentences=2, language=lang)
            if joined:
                return joined

    chunks = _split_context_chunks(context)
    if not chunks:
        return ""
    ranked = sorted(
        chunks,
        key=lambda c: (
            1 if re.search(r"brief synthesis|exceptionally|outstanding", c, re.I) else 0,
            len(c),
        ),
        reverse=True,
    )
    joined = _join_sentences([ranked[0]], max_sentences=1, language=language)
    if joined:
        return joined
    return _localize_answer(ranked[0], "en", language)


def _significance_score(text: str) -> int:
    lower = (text or "").lower()
    return sum(1 for term in _SIGNIFICANCE_CONTEXT_TERMS if term in lower)


def _significance_from_context(
    context: str, language: str, site: Optional[dict] = None
) -> str:
    """Svar om vad som är unikt/viktigt – ur UNESCO-text om outstanding/universal value."""
    units = _iter_search_units(context)
    if not units:
        return _intro_from_context(context, language, site=site)

    ranked = sorted(
        units,
        key=lambda unit: (_significance_score(unit), len(unit)),
        reverse=True,
    )
    top_hits = [u for u in ranked if _significance_score(u) > 0][:4]
    if not top_hits:
        return _intro_from_context(context, language, site=site)

    joined = _join_sentences(top_hits[:3], max_sentences=3, language=language)
    if joined:
        return joined
    return _localize_answer(top_hits[0], "en", language)


def _intro_subject_matches_site(question: str, site: dict) -> bool:
    subject = _extract_intro_subject(question).lower()
    if not subject:
        return False
    names = " ".join(
        str(site.get(key) or "")
        for key in ("name", "name_sv", "name_en")
    ).lower()
    return subject in names


def _cite_from_context(
    question: str, context: str, language: str, site: Optional[dict] = None
) -> str:
    if _asks_property_area_or_size(question):
        area_answer = _answer_property_area_from_context(context, language)
        if area_answer:
            return area_answer

    direct_fact = _direct_fact_answer(question, context, language, site=site)
    if direct_fact:
        return direct_fact

    if _asks_uniqueness_or_significance(question):
        significance = _significance_from_context(context, language, site=site)
        if significance:
            return significance

    terms = _retrieval_terms(question, language, site=site)
    if not terms:
        if _asks_site_intro(question):
            return _intro_from_context(context, language, site=site)
        return ""

    min_score = _min_required_word_matches(len(terms))
    if len(terms) <= 2:
        min_score = 1

    sentences = _filter_sentences_for_language(_iter_search_units(context), language)
    ranked = sorted(
        sentences,
        key=lambda s: _sentence_relevance(s, question, terms),
        reverse=True,
    )
    hits = [
        s
        for s in ranked
        if _score_sentence(s, terms) >= min_score
        or _question_answer_bonus(s, question) >= 3.0
    ]
    if not hits and _asks_site_intro(question):
        return _intro_from_context(context, language, site=site)
    if not hits:
        return ""
    if (
        _asks_site_intro(question)
        and site
        and _intro_subject_matches_site(question, site)
    ):
        intro = _intro_from_context(context, language, site=site)
        if intro:
            return intro
    return _join_sentences(hits[:3], language=language)


def _pick_language_fallback(lang: str, kind: str) -> str:
    code = _normalize_language(lang)
    table = _FALLBACK_WE_RETURN_BY_LANG if kind == "we_return" else _FALLBACK_NO_INFO_BY_LANG
    return table.get(code) or table["en"]


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
    lang_names = {
        "sv": "svenska",
        "en": "English",
        "fi": "suomi",
        "de": "Deutsch",
        "fr": "français",
        "es": "español",
        "ar": "العربية",
        "ru": "русский",
        "zh": "中文",
        "it": "italiano",
        "no": "norsk",
        "da": "dansk",
    }
    reply_lang = lang_names.get(lang, lang)
    if lang == "en":
        return (
            "You guide visitors at a UNESCO World Heritage site. Read the ENTIRE user question "
            "(any language).\n"
            "Answer ONLY using CONTEXT and FACTS below. Do not use outside knowledge.\n"
            f"- Personal questions (where do I live, my address, who am I): reply exactly {_DECLINE_PERSONAL}\n"
            f"- Off-topic (parking, moon, prices): reply exactly {_DECLINE_OFF_TOPIC}\n"
            f"- Not in sources, or 'when was it created' without UNESCO listing in sources: {_DECLINE_NO_INFO}\n"
            "- Never invent years. Max 3 sentences in English."
        )
    if lang == "sv":
        return (
            "Du är guide vid ett UNESCO-världsarv. Läs HELA användarens fråga (vilket språk som helst).\n"
            "Svara ENDAST med fakta från KONTEXT och FAKTA nedan. Använd inte extern kunskap.\n"
            f"- Personliga frågor (var bor jag, min adress, vem är jag): svara exakt {_DECLINE_PERSONAL}\n"
            f"- Utanför ämnet (parkering, månen, priser): svara exakt {_DECLINE_OFF_TOPIC}\n"
            f"- Saknas i källor, eller 'när skapades' utan UNESCO-listning i källor: {_DECLINE_NO_INFO}\n"
            "- Hitta inte på årtal. Max 3 meningar på svenska."
        )
    return (
        f"You guide visitors at a UNESCO World Heritage site. Read the ENTIRE user question "
        f"(any language). Reply in {reply_lang} ({lang}).\n"
        "Answer ONLY using CONTEXT and FACTS below. Do not use outside knowledge.\n"
        f"- Personal / off-topic / not in sources: use {_DECLINE_PERSONAL}, {_DECLINE_OFF_TOPIC}, "
        f"or {_DECLINE_NO_INFO} as appropriate.\n"
        "- Never invent years. Max 3 sentences."
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
    language = _infer_question_language(question, fallback=language)
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

    if intent == QuestionIntent.HERITAGE_CONTENT and _asks_creation_without_listing(
        question
    ):
        return _pick_language_fallback(language, "no_info"), sources, False

    if intent == QuestionIntent.HERITAGE_CONTENT and _asks_property_area_or_size(
        question
    ):
        area_answer = _answer_property_area_from_context(context, language)
        if area_answer:
            return area_answer, sources, False

    cited = _cite_from_context(question, context, language, site=site)
    if cited:
        return _format_yes_no_answer(question, cited, language), sources, False

    if intent == QuestionIntent.HERITAGE_CONTENT and _asks_site_intro(question):
        intro = _intro_from_context(context, language, site=site)
        if intro:
            return _format_yes_no_answer(question, intro, language), sources, False

    if intent == QuestionIntent.HERITAGE_CONTENT and _asks_uniqueness_or_significance(
        question
    ):
        significance = _significance_from_context(context, language, site=site)
        if significance:
            return _format_yes_no_answer(question, significance, language), sources, False

    if _openai_enabled() and intent == QuestionIntent.HERITAGE_CONTENT:
        openai_result = _try_openai_answer(question, context, site, language)
        if openai_result:
            return (
                _format_yes_no_answer(question, openai_result[0], language),
                sources,
                openai_result[1],
            )

    return _pick_language_fallback(language, "no_info"), sources, False
