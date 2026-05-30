"""
Integration endpoints – dela med andra grupper (meddelande-API, SMS-länkar).
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.services.email_service import (
    EmailDeliveryError,
    email_delivery_configured,
    email_provider_name,
    email_uses_https_api,
    send_email,
)
from app.services.message_builder import site_detail_url

router = APIRouter(prefix="/api/integration", tags=["Integration"])


@router.get("/config")
def integration_config():
    """
    Visar vilka URL:er andra grupper ska anropa/byta.
    Sätt NOTIFICATION_SERVICE_URL till annan grupps bas-URL för att skicka SMS via dem.
    """
    site_base = settings.SITE_BASE_URL.rstrip("/")
    notification_base = (
        settings.NOTIFICATION_SERVICE_URL.strip().rstrip("/")
        if settings.NOTIFICATION_SERVICE_URL
        else site_base
    )
    example_site = "1027"
    return {
        "success": True,
        "site_base_url": site_base,
        "site_link_example": site_detail_url(example_site, unesco_id=example_site),
        "site_link_pattern": f"{site_base}/sites/{{unesco_id}}",
        "notification_api_url": f"{notification_base}/api/notification/send",
        "notification_api_legacy_url": f"{notification_base}/notification/send-notification",
        "uses_external_notification_service": bool(settings.NOTIFICATION_SERVICE_URL.strip()),
        "email_delivery_configured": email_delivery_configured(),
        "email_provider": email_provider_name(),
        "email_uses_https_api": email_uses_https_api(),
        "email_railway_smtp_note": (
            "Railway Hobby/Free blockerar utgående SMTP (port 587). "
            "Använd EMAIL_PROVIDER=smtp2go, resend eller sendgrid med HTTPS API i produktion."
            if email_provider_name() == "smtp"
            else None
        ),
        "notification_payload_example": {
            "channel": "sms",
            "to": "+46700000001",
            "message": f"Du är nära Gruvorna i Falun {site_detail_url(example_site, unesco_id=example_site)}",
            "user_id": "+46700000001",
            "site_id": example_site,
        },
        "notification_error_codes": ["invalid_type", "invalid_recipient", "cooldown"],
    }


def _masked_from_address() -> str | None:
    addr = (settings.SMTP2GO_FROM or settings.RESEND_FROM or settings.SMTP_FROM or "").strip()
    if "@" not in addr:
        return None
    local, domain = addr.split("@", 1)
    if len(local) <= 2:
        masked_local = "*"
    else:
        masked_local = f"{local[:2]}***"
    return f"{masked_local}@{domain}"


@router.get("/email-health")
def email_health():
    """Hjälper felsöka e-post utan att exponera hemligheter."""
    from_set = _masked_from_address()
    return {
        "success": True,
        "email_provider": email_provider_name(),
        "email_delivery_configured": email_delivery_configured(),
        "email_from_configured": bool(from_set),
        "email_from_hint": from_set,
        "email_uses_https_api": email_uses_https_api(),
    }


@router.post("/email-test")
def email_test(body: dict):
    """
    Skickar ett testmail synkront och returnerar verkligt fel från leverantören.
    Body: {"to": "mottagare@example.com"}
    """
    to = (body.get("to") or "").strip()
    if not to or "@" not in to:
        return JSONResponse(status_code=400, content={"success": False, "error": "invalid_recipient"})
    if not email_delivery_configured():
        return JSONResponse(
            status_code=503,
            content={"success": False, "error": "email_not_configured"},
        )
    try:
        result = send_email(
            to,
            "Heritage Connect – test",
            "Det här är ett testmail från Heritage Connect. Om du ser detta fungerar e-post.",
        )
        return {"success": True, "provider": email_provider_name(), "result": result}
    except EmailDeliveryError as exc:
        return JSONResponse(
            status_code=502,
            content={"success": False, "error": "email_delivery_failed", "message": str(exc)},
        )
