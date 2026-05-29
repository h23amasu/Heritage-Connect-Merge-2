"""
Bygger lokaliserade SMS/meddelanden (använder översättningstjänsten internt).
"""
from app.core.config import settings
from app.services.translate_service import translate_text


def site_detail_url(site_id: int | str, unesco_id: str | None = None) -> str:
    base = settings.SITE_BASE_URL.rstrip("/")
    ref = unesco_id or site_id
    return f"{base}/sites/{ref}"


def build_near_site_sms(
    site_name: str,
    site_id: int | str,
    language: str = "sv",
    *,
    unesco_id: str | None = None,
) -> str:
    """Standardtext för geofencing-SMS på användarens språk."""
    link_id = unesco_id or site_id
    sv_message = (
        f"Du är nära {site_name}. "
        f"Läs mer: {site_detail_url(link_id, unesco_id=unesco_id or None)}"
    )
    lang = (language or "sv").lower()[:2]
    if lang == "sv":
        return sv_message[:160]
    translated = translate_text(sv_message, "sv", lang)
    return translated[:160]


def build_subscription_receipt_email(
    phone: str,
    end_date: str,
    language: str = "sv",
) -> tuple[str, str]:
    """Returnerar (subject, body) för kvitto via e-post."""
    sv_subject = "Heritage Connect – kvitto för prenumeration"
    sv_body = (
        f"Tack för din prenumeration!\n\n"
        f"Telefon: {phone}\n"
        f"Prenumerationen gäller till: {end_date}\n"
        f"Ingen automatisk förnyelse.\n\n"
        f"Heritage Connect"
    )
    lang = (language or "sv").lower()[:2]
    if lang == "sv":
        return sv_subject, sv_body
    return (
        translate_text(sv_subject, "sv", lang),
        translate_text(sv_body, "sv", lang),
    )
