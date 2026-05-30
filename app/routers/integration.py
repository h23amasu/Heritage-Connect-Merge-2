"""
Integration endpoints – dela med andra grupper (meddelande-API, SMS-länkar).
"""
from fastapi import APIRouter

from app.core.config import settings
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
        "notification_api_url": f"{notification_base}/notification/send-notification",
        "uses_external_notification_service": bool(settings.NOTIFICATION_SERVICE_URL.strip()),
        "notification_payload_example": {
            "type": "sms",
            "to": "+46700000001",
            "message": f"Du är nära Gruvorna i Falun {site_detail_url(example_site, unesco_id=example_site)}",
            "user_id": "+46700000001",
            "site_id": example_site,
        },
    }
