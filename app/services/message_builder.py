"""
Bygger lokaliserade SMS/meddelanden (anvander oversattningstjansten internt).
"""
from urllib.parse import urlencode

from app.core.config import settings
from app.services.translate_service import translate_text


def site_detail_url(
    site_id: int | str,
    unesco_id: str | None = None,
    language: str | None = None,
) -> str:
    base = settings.SITE_BASE_URL.rstrip("/")
    ref = unesco_id or site_id
    url = f"{base}/sites/{ref}"
    lang = (language or "").strip().lower()[:2]
    if not lang:
        return url
    return f"{url}?{urlencode({'lang': lang})}"


def _fit_sms_with_url(prefix: str, name: str, url: str, *, max_len: int = 160) -> str:
    """Bygg SMS dar hela URL:en alltid far plats."""
    url = url.strip()
    if len(url) >= max_len:
        return url[:max_len]

    separator = " "
    available_for_name = max_len - len(prefix) - len(separator) - len(url)
    display_name = (name or "varldsarv").strip() or "varldsarv"
    if len(display_name) > available_for_name:
        if available_for_name <= 1:
            return url
        display_name = display_name[: available_for_name - 1] + "..."

    return f"{prefix}{display_name}{separator}{url}"


def build_near_site_sms(
    site_name: str,
    site_id: int | str,
    language: str = "sv",
    *,
    unesco_id: str | None = None,
    localized_name: str | None = None,
) -> str:
    """Standardtext for geofencing-SMS pa anvandarens sprak."""
    link_id = unesco_id or site_id
    lang = (language or "sv").lower()[:2]
    url = site_detail_url(link_id, unesco_id=unesco_id or None, language=lang)
    display_name = (localized_name or site_name or "varldsarv").strip()

    if lang == "sv":
        return _fit_sms_with_url("Du ar nara ", display_name, url)

    sv_message = _fit_sms_with_url("Du ar nara ", display_name, url)
    return translate_text(sv_message, "sv", lang)[:160]


def build_near_site_email(
    site_name: str,
    site_id: int | str,
    language: str = "sv",
    *,
    unesco_id: str | None = None,
    localized_name: str | None = None,
) -> tuple[str, str]:
    """Returnerar (subject, body) for geofencing-notis via e-post."""
    link_id = unesco_id or site_id
    lang = (language or "sv").lower()[:2]
    url = site_detail_url(link_id, unesco_id=unesco_id or None, language=lang)
    display_name = (localized_name or site_name or "varldsarv").strip() or "varldsarv"

    sv_subject = f"Varldsarv nara dig: {display_name}"
    sv_body = (
        f"Du ar nara {display_name}.\n\n"
        f"Las mer har:\n{url}\n\n"
        f"Heritage Connect"
    )
    if lang == "sv":
        return sv_subject, sv_body
    return (
        translate_text(sv_subject, "sv", lang),
        translate_text(sv_body, "sv", lang),
    )


def build_subscription_confirmation(
    language: str = "sv",
    channel: str = "sms",
) -> tuple[str | None, str]:
    """Bekraftelse efter startad prenumeration."""
    lang = (language or "sv").lower()[:2]
    sv_sms = (
        "Din Heritage Connect-prenumeration ar nu aktiv. "
        "Du far nu notiser om varldsarv nara dig."
    )
    sv_subject = "Heritage Connect - prenumeration aktiverad"
    sv_email = (
        "Din Heritage Connect-prenumeration ar nu aktiv.\n\n"
        "Du far nu notiser om varldsarv nara dig i vald kanal.\n\n"
        "Heritage Connect"
    )

    if channel == "email":
        if lang == "sv":
            return sv_subject, sv_email
        return (
            translate_text(sv_subject, "sv", lang),
            translate_text(sv_email, "sv", lang),
        )

    if lang == "sv":
        return None, sv_sms
    return None, translate_text(sv_sms, "sv", lang)[:160]


def owntracks_webhook_url() -> str:
    return f"{settings.SITE_BASE_URL.rstrip('/')}/api/location/owntracks"


def build_subscription_confirmation_email(
    phone: str,
    end_date: str,
    language: str = "sv",
    *,
    notification_channel: str = "sms",
) -> tuple[str, str]:
    """Bekraftelse + kvitto + OwnTracks-instruktioner (via e-post vid prenumeration)."""
    phone_display = (phone or "").strip() or "-"
    webhook_url = owntracks_webhook_url()
    channel = (notification_channel or "sms").lower()
    channel_note = (
        "Du far notiser via SMS nar du ar nara ett varldsarv."
        if channel == "sms"
        else "Du far notiser via e-post nar du ar nara ett varldsarv."
    )

    sv_subject = "Heritage Connect - prenumeration bekräftad"
    sv_body = (
        f"Tack for din prenumeration!\n\n"
        f"Din prenumeration ar nu aktiv och galler till {end_date}.\n"
        f"{channel_note}\n"
        f"Ingen automatisk fornyelse.\n\n"
        f"Kontaktnummer kopplat till kontot: {phone_display}\n\n"
        f"--- OwnTracks (GPS i bakgrunden) ---\n"
        f"For att platsen ska fungera nar telefonen ar i fickan behover du appen OwnTracks "
        f"(iOS/Android). Webbplatsen kan inte lasa GPS hela tiden pa egen hand.\n\n"
        f"1. Ladda ner OwnTracks (App Store eller Google Play)\n"
        f"2. Settings/Preferences -> Mode: HTTP\n"
        f"3. URL: {webhook_url}\n"
        f"4. Identification -> User: {phone_display}\n"
        f"   (maste vara samma nummer som vid SMS-prenumeration, med landskod t.ex. +46)\n"
        f"5. Device: valfritt, t.ex. iphone eller android\n"
        f"6. Sla pa bakgrundssparing och platsbehorighet \"Alltid\"\n\n"
        f"Forsta gangen OwnTracks skickar position registreras din hemzon - da skickas "
        f"inget larm. Nar du lamnar hemzonen och kommer nara ett varldsarv skickas notis "
        f"(SMS eller e-post beroende pa vad du valde).\n\n"
        f"Mer hjalp: https://owntracks.org/booklet/\n\n"
        f"Vanliga halsningar,\n"
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
    """Bakåtkompatibelt namn - samma innehåll som bekräftelsemailet."""
    return build_subscription_confirmation_email(
        phone, end_date, language, notification_channel=notification_channel
    )
