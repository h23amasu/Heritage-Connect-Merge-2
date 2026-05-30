"""
HTTP-klienter för kommunikation mellan microservices.
Använder in-process-anrop om respektive *_SERVICE_URL saknas (monolit-läge).
"""
from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import settings
from app.schemas import NotificationRequest

logger = logging.getLogger(__name__)


def _service_root(url: str) -> str:
    return str(url or "").strip().rstrip("/")


def translate_text_remote(text: str, source_lang: str, target_lang: str) -> str:
    base = _service_root(settings.TRANSLATE_SERVICE_URL)
    if not base:
        from app.services.translate_service import translate_text

        return translate_text(text, source_lang, target_lang)

    payload = {
        "text": text,
        "source_language": source_lang,
        "target_language": target_lang,
    }
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(f"{base}/api/translate", json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("translated_text") or text
    except Exception:
        logger.exception("Översättnings-API svarade inte (%s)", base)
        return text


def send_notification(request: NotificationRequest) -> dict[str, Any]:
    base = _service_root(settings.NOTIFICATION_SERVICE_URL)
    if not base:
        from app.services.notification_service import (
            ERROR_COOLDOWN,
            check_cooldown,
            dispatch_notification,
            record_cooldown,
            validate_notification_request,
        )

        error_code = validate_notification_request(request)
        if error_code:
            return {"success": False, "error": error_code}
        if check_cooldown(request):
            return {"success": False, "error": ERROR_COOLDOWN}
        record_cooldown(request)
        dispatch_notification(request)
        return {"success": True, "channel": request.type}

    payload = request.model_dump(mode="json")
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(f"{base}/notification/send-notification", json=payload)
            if response.content:
                return response.json()
            return {"success": response.is_success}
    except httpx.HTTPStatusError as exc:
        if exc.response.content:
            try:
                return exc.response.json()
            except Exception:
                pass
        return {"success": False, "error": f"http_{exc.response.status_code}"}
    except Exception:
        logger.exception("Meddelande-API svarade inte (%s)", base)
        return {"success": False, "error": "notification_unreachable"}


def deliver_notification_message(request: NotificationRequest) -> bool:
    """
    Levererar meddelande utan extra cooldown (anroparen hanterar det).
    Använder annan grupps API om NOTIFICATION_SERVICE_URL är satt.
    """
    base = _service_root(settings.NOTIFICATION_SERVICE_URL)
    if base:
        result = send_notification(request)
        return bool(result.get("success"))

    from app.services.notification_service import dispatch_notification

    return dispatch_notification(request)
