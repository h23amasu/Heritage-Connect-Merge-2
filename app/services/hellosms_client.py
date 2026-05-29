"""
HelloSMS HTTP API client.

Official docs: https://guide.hellosms.se/article/28-hellosms-api
API base: https://api.hellosms.se/
Send: POST /v1/sms/send/  (JSON + HTTP Basic Auth)
"""
from __future__ import annotations

import base64
from typing import Any, Optional

import httpx

from app.core.config import settings


class HelloSMSError(Exception):
    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


def _auth_header() -> str:
    token = base64.b64encode(
        f"{settings.HELLOSMS_API_USERNAME}:{settings.HELLOSMS_API_PASSWORD}".encode()
    ).decode()
    return f"Basic {token}"


def _normalize_to_for_hellosms(phone_e164: str) -> str:
    """HelloSMS accepts +467...; keep E.164 when possible."""
    return phone_e164.replace(" ", "")


def send_sms_via_hellosms(
    to: str,
    message: str,
    *,
    subject: Optional[str] = None,
    from_sender: Optional[str] = None,
) -> dict[str, Any]:
    """
    Sends one SMS via HelloSMS API.
    Returns parsed JSON response on success.
    """
    if not settings.HELLOSMS_API_USERNAME or not settings.HELLOSMS_API_PASSWORD:
        raise HelloSMSError("HelloSMS credentials missing (HELLOSMS_API_USERNAME/PASSWORD)")

    payload: dict[str, Any] = {
        "to": _normalize_to_for_hellosms(to),
        "message": message,
        "testMode": settings.HELLOSMS_TEST_MODE,
        "shortLinks": settings.HELLOSMS_SHORT_LINKS,
    }
    if subject:
        payload["subject"] = subject
    elif settings.HELLOSMS_DEFAULT_SUBJECT:
        payload["subject"] = settings.HELLOSMS_DEFAULT_SUBJECT
    sender = from_sender or settings.HELLOSMS_SENDER
    if sender:
        payload["from"] = sender

    headers = {
        "Content-Type": "application/json",
        "Authorization": _auth_header(),
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            settings.HELLOSMS_API_URL,
            json=payload,
            headers=headers,
        )

    if response.status_code == 401:
        raise HelloSMSError("HelloSMS authentication failed", status_code=401)

    try:
        data = response.json()
    except Exception as exc:
        raise HelloSMSError(
            f"Invalid HelloSMS response (HTTP {response.status_code})"
        ) from exc

    if response.status_code >= 400 or data.get("status") != "success":
        detail = data.get("statusText") or response.text or "Unknown error"
        raise HelloSMSError(detail, status_code=response.status_code)

    return data
