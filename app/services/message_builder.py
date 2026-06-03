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


def owntracks_webhook_url() -> str:
    return f"{settings.SITE_BASE_URL.rstrip('/')}/api/location/owntracks"


def build_subscription_confirmation_email(
    phone: str,
    end_date: str,
    language: str = "sv",
    *,
    notification_channel: str = "sms",
) -> tuple[str, str]:
    """Bekräftelse + kvitto + OwnTracks-instruktioner (alltid via e-post vid prenumeration)."""
    phone_display = (phone or "").strip() or "—"
    webhook_url = owntracks_webhook_url()
    channel = (notification_channel or "sms").lower()
    channel_note = (
        "Du får notiser via SMS när du är nära ett världsarv."
        if channel == "sms"
        else "Du får notiser via e-post när du är nära ett världsarv."
    )

    sv_subject = "Heritage Connect – prenumeration bekräftad"
    sv_body = (
        f"Tack för din prenumeration!\n\n"
        f"Din prenumeration är nu aktiv och gäller till {end_date}.\n"
        f"{channel_note}\n"
        f"Ingen automatisk förnyelse.\n\n"
        f"Kontaktnummer kopplat till kontot: {phone_display}\n\n"
        f"--- OwnTracks (GPS i bakgrunden) ---\n"
        f"För att platsen ska fungera när telefonen är i fickan behöver du appen OwnTracks "
        f"(iOS/Android). Webbplatsen kan inte läsa GPS hela tiden på egen hand.\n\n"
        f"1. Ladda ner OwnTracks (App Store eller Google Play)\n"
        f"2. Settings/Preferences → Mode: HTTP\n"
        f"3. URL: {webhook_url}\n"
        f"4. Identification → User: {phone_display}\n"
        f"   (måste vara samma nummer som vid SMS-prenumeration, med landskod t.ex. +46)\n"
        f"5. Device: valfritt, t.ex. iphone eller android\n"
        f"6. Slå på bakgrundsspårning och platsbehörighet \"Alltid\"\n\n"
        f"Första gången OwnTracks skickar position registreras din hemzon – då skickas "
        f"inget larm. När du lämnar hemzonen och kommer nära ett världsarv skickas notis "
        f"(SMS eller e-post beroende på vad du valde).\n\n"
        f"Mer hjälp: https://owntracks.org/booklet/\n\n"
        f"Vänliga hälsningar,\n"
        f"Heritage Connect"
    )
    lang = (language or "sv").lower()[:2]
    if lang == "sv":
        return sv_subject, sv_body
    return (
        translate_text(sv_subject, "sv", lang),
        translate_text(sv_body, "sv", lang),
    )


def build_subscription_receipt_email(
    phone: str,
    end_date: str,
    language: str = "sv",
    *,
    notification_channel: str = "sms",
) -> tuple[str, str]:
    """Bakåtkompatibelt namn – samma innehåll som bekräftelsemailet."""
    return build_subscription_confirmation_email(
        phone, end_date, language, notification_channel=notification_channel
    )
