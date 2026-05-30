"""
Email service – provider-agnostic. Mock, SMTP eller SendGrid via .env.
"""
import logging
import smtplib
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from email.mime.text import MIMEText

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailDeliveryError(Exception):
    """E-post kunde inte levereras (SMTP/SendGrid)."""


class EmailProviderInterface(ABC):
    @abstractmethod
    def send(self, to: str, subject: str, message: str) -> dict:
        pass


class MockEmailProvider(EmailProviderInterface):
    def send(self, to: str, subject: str, message: str) -> dict:
        logger.warning(
            "[MOCK EMAIL] Ingen riktig leverans – sätt EMAIL_PROVIDER=smtp (eller sendgrid) i .env. "
            "To=%s Subject=%s",
            to,
            subject,
        )
        print(f"[MOCK EMAIL] To: {to}")
        print(f"[MOCK EMAIL] Subject: {subject}")
        print(f"[MOCK EMAIL] Message: {message}")
        return {
            "status": "mock",
            "message_id": f"mock_email_{uuid.uuid4().hex[:12]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class SmtpEmailProvider(EmailProviderInterface):
    def send(self, to: str, subject: str, message: str) -> dict:
        if not settings.SMTP_HOST:
            raise EmailDeliveryError("SMTP_HOST saknas i .env")

        msg = MIMEText(message, "plain", "utf-8")
        msg["Subject"] = subject or settings.SMTP_DEFAULT_SUBJECT
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to

        try:
            if settings.SMTP_USE_SSL:
                with smtplib.SMTP_SSL(
                    settings.SMTP_HOST, settings.SMTP_PORT, timeout=30
                ) as server:
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
                    if settings.SMTP_USE_TLS:
                        server.starttls()
                    if settings.SMTP_USER and settings.SMTP_PASSWORD:
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.send_message(msg)
        except smtplib.SMTPException as exc:
            raise EmailDeliveryError(f"SMTP-fel: {exc}") from exc

        return {
            "status": "sent",
            "message_id": f"smtp_{uuid.uuid4().hex[:12]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class SendGridEmailProvider(EmailProviderInterface):
    def send(self, to: str, subject: str, message: str) -> dict:
        api_key = (settings.SENDGRID_API_KEY or "").strip()
        if not api_key:
            raise EmailDeliveryError("SENDGRID_API_KEY saknas i .env")

        from_email = settings.SMTP_FROM or settings.SENDGRID_FROM
        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": from_email},
            "subject": subject or settings.SMTP_DEFAULT_SUBJECT,
            "content": [{"type": "text/plain", "value": message}],
        }

        try:
            response = httpx.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=30.0,
            )
            if response.status_code not in (200, 202):
                raise EmailDeliveryError(
                    f"SendGrid svarade {response.status_code}: {response.text[:300]}"
                )
        except httpx.HTTPError as exc:
            raise EmailDeliveryError(f"SendGrid-nätverksfel: {exc}") from exc

        return {
            "status": "sent",
            "message_id": f"sendgrid_{uuid.uuid4().hex[:12]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class ResendEmailProvider(EmailProviderInterface):
    def send(self, to: str, subject: str, message: str) -> dict:
        api_key = (settings.RESEND_API_KEY or "").strip()
        if not api_key:
            raise EmailDeliveryError("RESEND_API_KEY saknas i .env")

        from_email = settings.RESEND_FROM or settings.SMTP_FROM
        payload = {
            "from": from_email,
            "to": [to],
            "subject": subject or settings.SMTP_DEFAULT_SUBJECT,
            "text": message,
        }

        try:
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=30.0,
            )
            if response.status_code not in (200, 201):
                raise EmailDeliveryError(
                    f"Resend svarade {response.status_code}: {response.text[:300]}"
                )
            data = response.json()
        except httpx.HTTPError as exc:
            raise EmailDeliveryError(f"Resend-nätverksfel: {exc}") from exc

        return {
            "status": "sent",
            "message_id": data.get("id") or f"resend_{uuid.uuid4().hex[:12]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


class Smtp2GoEmailProvider(EmailProviderInterface):
    def send(self, to: str, subject: str, message: str) -> dict:
        api_key = (settings.SMTP2GO_API_KEY or "").strip()
        if not api_key:
            raise EmailDeliveryError("SMTP2GO_API_KEY saknas i .env")

        from_email = (settings.SMTP2GO_FROM or settings.SMTP_FROM or "").strip()
        if not from_email or "@" not in from_email:
            raise EmailDeliveryError(
                "SMTP2GO_FROM saknas i .env – måste vara en verifierad Single sender i SMTP2GO"
            )

        sender = (
            from_email
            if "<" in from_email and ">" in from_email
            else f"Heritage Connect <{from_email}>"
        )
        payload = {
            "sender": sender,
            "to": [to],
            "subject": subject or settings.SMTP_DEFAULT_SUBJECT,
            "text_body": message,
            "fastaccept": True,
        }

        try:
            response = httpx.post(
                "https://api.smtp2go.com/v3/email/send",
                headers={
                    "Content-Type": "application/json",
                    "X-Smtp2go-Api-Key": api_key,
                },
                json=payload,
                timeout=30.0,
            )
            try:
                data = response.json()
            except ValueError:
                data = {}

            email_data = data.get("data") or {}
            api_error = email_data.get("error")
            if response.status_code != 200 or api_error:
                detail = api_error or response.text[:300]
                raise EmailDeliveryError(
                    f"SMTP2GO svarade {response.status_code}: {detail}"
                )
            if email_data.get("failed"):
                raise EmailDeliveryError(
                    f"SMTP2GO kunde inte skicka: {email_data.get('failures') or data}"
                )
        except httpx.HTTPError as exc:
            raise EmailDeliveryError(f"SMTP2GO-nätverksfel: {exc}") from exc

        message_id = email_data.get("email_id") or data.get("request_id") or f"smtp2go_{uuid.uuid4().hex[:12]}"
        logger.info("SMTP2GO mail skickat till %s (id=%s)", to, message_id)
        return {
            "status": "sent",
            "message_id": message_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


def _resolve_provider() -> EmailProviderInterface:
    provider = (settings.EMAIL_PROVIDER or "mock").lower().strip()

    if provider == "sendgrid":
        return SendGridEmailProvider()
    if provider == "resend":
        return ResendEmailProvider()
    if provider == "smtp2go":
        return Smtp2GoEmailProvider()
    if provider == "smtp" and settings.SMTP_HOST:
        return SmtpEmailProvider()
    if provider == "smtp" and not settings.SMTP_HOST:
        logger.warning("EMAIL_PROVIDER=smtp men SMTP_HOST saknas – använder mock")
    return MockEmailProvider()


def send_email(to: str, subject: str, message: str) -> dict:
    return _resolve_provider().send(to, subject, message)


def email_delivery_configured() -> bool:
    provider = (settings.EMAIL_PROVIDER or "mock").lower().strip()
    if provider == "sendgrid":
        return bool((settings.SENDGRID_API_KEY or "").strip())
    if provider == "resend":
        return bool((settings.RESEND_API_KEY or "").strip())
    if provider == "smtp2go":
        from_addr = (settings.SMTP2GO_FROM or settings.SMTP_FROM or "").strip()
        return bool((settings.SMTP2GO_API_KEY or "").strip() and "@" in from_addr)
    if provider == "smtp":
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)
    return False


def email_provider_name() -> str:
    return (settings.EMAIL_PROVIDER or "mock").lower().strip()


def email_uses_https_api() -> bool:
    return email_provider_name() in {"sendgrid", "resend", "smtp2go"}
