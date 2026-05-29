"""
Router: Översättningstjänst (kurskrav – internt återanvändbar).
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.schemas import (
    TranslateBatchRequest,
    TranslateBatchResponse,
    TranslateRequest,
    TranslateResponse,
)
from app.services.translate_service import (
    is_valid_language_code,
    normalize_language_code,
    translate_text,
    translate_texts,
)

router = APIRouter(prefix="/api/translate", tags=["Translation"])


def _language_error(source: str, target: str) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": "invalid_language_code",
            "message": "Use two-letter ISO 639-1 codes (e.g. sv, en, fi, ar, ja).",
            "source_language": source,
            "target_language": target,
        },
    )


@router.post("", response_model=TranslateResponse)
def translate(request: TranslateRequest):
    """
    Översätter löpande text från ett språk till ett annat.
    Backup när UNESCO-data saknar text på tidningens språk.
    """
    source = normalize_language_code(request.source_language)
    target = normalize_language_code(request.target_language)

    if not is_valid_language_code(source) or not is_valid_language_code(target):
        return _language_error(source, target)

    translated = translate_text(request.text, source, target)
    return TranslateResponse(
        success=True,
        source_language=source,
        target_language=target,
        original_text=request.text,
        translated_text=translated,
    )


@router.post("/batch", response_model=TranslateBatchResponse)
def translate_batch(request: TranslateBatchRequest):
    """Översätter flera texter i ett anrop (tidning + modal)."""
    source = normalize_language_code(request.source_language)
    target = normalize_language_code(request.target_language)

    if not is_valid_language_code(source) or not is_valid_language_code(target):
        return _language_error(source, target)

    translations = translate_texts(request.texts, source, target)
    return TranslateBatchResponse(
        success=True,
        source_language=source,
        target_language=target,
        translations=translations,
    )
