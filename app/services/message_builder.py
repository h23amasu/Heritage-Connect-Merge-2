"""
Bygger lokaliserade SMS/meddelanden (använder översättningstjänsten internt).
"""
from app.core.config import settings
from app.services.translate_service import translate_text


def site_detail_url(site_id: int | str, unesco_id: str | None = None) -> str:
    base = settings.SITE_BASE_URL.rstrip("/")
    ref = unesco_id or site_id
    return f"{base}/sites/{ref}"


def _fit_sms_with_url(prefix: str, name: str, url: str, *, max_len: int = 160) -> str:
    """Bygg SMS där hela URL:en alltid får plats."""
    url = url.strip()
    if len(url) >= max_len:
        return url[:max_len]

    separator = " "
    available_for_name = max_len - len(prefix) - len(separator) - len(url)
    display_name = (name or "världsarv").strip() or "världsarv"
    if len(display_name) > available_for_name:
        if available_for_name <= 1:
            return url
        display_name = display_name[: available_for_name - 1] + "…"

    return f"{prefix}{display_name}{separator}{url}"


def build_near_site_sms(
    site_name: str,
    site_id: int | str,
    language: str = "sv",
    *,
    unesco_id: str | None = None,
    localized_name: str | None = None,
) -> str:
    """Standardtext för geofencing-SMS på användarens språk."""
    link_id = unesco_id or site_id
    url = site_detail_url(link_id, unesco_id=unesco_id or None)
    lang = (language or "sv").lower()[:2]
    display_name = (localized_name or site_name or "världsarv").strip()

    if lang == "sv":
        return _fit_sms_with_url("Du är nära ", display_name, url)

    sv_message = _fit_sms_with_url("Du är nära ", display_name, url)
    return translate_text(sv_message, "sv", lang)[:160]


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
