"""
Project settings - reads from environment variables or the .env file
"""
import os
from typing import Any

from pydantic import model_validator
from pydantic_settings import BaseSettings


def _strip_wrapping_quotes(value: Any) -> Any:
    if not isinstance(value, str):
        return value
    cleaned = value.strip()
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in ('"', "'"):
        return cleaned[1:-1]
    return cleaned


class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = (
        "postgresql://heritage_connect:heritage_connect_dev@localhost:5432/heritage_connect"
    )

    # Application settings
    APP_NAME: str = "Heritage Connect"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Notification / geofencing
    NOTIFICATION_COOLDOWN_SECONDS: int = 60
    DEFAULT_HOME_RADIUS_KM: float = 5.0
    SITE_NOTIFY_RADIUS_KM: float = 30.0
    GEOFENCING_DEMO_MODE: bool = False  # true = plats/SMS-test utan PostgreSQL

    # SMS settings (HelloSMS: https://app.hellosms.se/ – API user at dashboard.hellosms.se)
    SMS_PROVIDER: str = "mock"  # mock | hellosms
    HELLOSMS_API_URL: str = "https://api.hellosms.se/v1/sms/send/"
    HELLOSMS_API_USERNAME: str = ""
    HELLOSMS_API_PASSWORD: str = ""
    HELLOSMS_SENDER: str = ""  # optional avsändare (3–11 tecken) eller telefonnummer
    HELLOSMS_DEFAULT_SUBJECT: str = "Heritage Connect"
    HELLOSMS_TEST_MODE: bool = True  # true = inga SMS skickas (enligt HelloSMS)
    HELLOSMS_SHORT_LINKS: bool = False

    # AI settings
    AI_PROVIDER: str = "mock"  # mock, openai or ollama
    OPENAI_API_KEY: str = ""

    # Payment settings
    PAYMENT_PROVIDER: str = "mock"  # mock or stripe
    # true = enkel mock-betalning i UI trots Stripe-nycklar (sätt false för Stripe checkout)
    PAYMENT_DEMO_USE_MOCK: bool = False
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""

    # BankID – mock (demo) eller bankid (riktig RP via pybankid)
    BANKID_PROVIDER: str = "mock"  # mock | bankid
    BANKID_TEST_SERVER: bool = True  # true = BankID testmiljö
    BANKID_CERT_FILE: str = ""
    BANKID_KEY_FILE: str = ""
    BANKID_CERT_PEM: str = ""  # alternativ till fil – för Railway (hela PEM som env)
    BANKID_KEY_PEM: str = ""

    # E-post (notification API channel=email)
    # mock = loggar bara (API svarar success men inget mail i inkorgen)
    # smtp = Gmail m.fl. | sendgrid = SendGrid HTTP | resend = Resend HTTP (Railway Hobby)
    EMAIL_PROVIDER: str = "mock"  # mock | smtp | sendgrid | resend
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@heritage-connect.example"
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False  # true för t.ex. Gmail port 465
    SMTP_DEFAULT_SUBJECT: str = "Heritage Connect"
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM: str = ""  # valfritt, annars SMTP_FROM
    RESEND_API_KEY: str = ""
    RESEND_FROM: str = ""  # valfritt, annars SMTP_FROM

    # API-nyckel för testmiljö (valfri – frontend skickar Bearer)
    API_BEARER_TOKEN: str = ""

    # Länkar i SMS (sätt till UI-gruppens URL i test/produktion)
    SITE_BASE_URL: str = "https://heritage-connect.example"

    # Skapa tabeller vid start (utveckling/test – använd Alembic i produktion)
    AUTO_CREATE_DB_TABLES: bool = True

    # Översättning: dictionary | deep | auto (auto = deep om tillgänglig, annars dictionary)
    TRANSLATE_PROVIDER: str = "auto"

    # Microservices – egna IP/port per tjänst (tom sträng = in-process/monolit)
    NOTIFICATION_SERVICE_URL: str = ""
    TRANSLATE_SERVICE_URL: str = ""
    GEO_SERVICE_URL: str = ""
    AI_SERVICE_URL: str = ""
    CORE_SERVICE_URL: str = ""

    # Valfritt: extern bildsökning (fallback när UNESCO saknar bra bild)
    GOOGLE_CSE_API_KEY: str = ""
    GOOGLE_CSE_CX: str = ""

    @model_validator(mode="before")
    @classmethod
    def strip_env_quotes(cls, data: Any) -> Any:
        """Railway Raw Editor kan spara värden med citationstecken – rensa dem."""
        if isinstance(data, dict):
            cleaned = {key: _strip_wrapping_quotes(value) for key, value in data.items()}
            if not cleaned.get("HELLOSMS_API_USERNAME") and cleaned.get("HELLOSMS_USERNAME"):
                cleaned["HELLOSMS_API_USERNAME"] = cleaned["HELLOSMS_USERNAME"]
            if not cleaned.get("HELLOSMS_API_PASSWORD") and cleaned.get("HELLOSMS_PASSWORD"):
                cleaned["HELLOSMS_API_PASSWORD"] = cleaned["HELLOSMS_PASSWORD"]
            if not cleaned.get("HELLOSMS_SENDER") and cleaned.get("HELLOSMS_FROM"):
                cleaned["HELLOSMS_SENDER"] = cleaned["HELLOSMS_FROM"]
            return cleaned
        return data

    @model_validator(mode="after")
    def apply_runtime_defaults(self) -> "Settings":
        """Fyll i SITE_BASE_URL på Railway om placeholder används (SMS-länkar)."""
        base = (self.SITE_BASE_URL or "").strip().rstrip("/")
        placeholder_markers = (
            "heritage-connect.example",
            "your-app.up.railway.app",
            "example.com",
        )
        needs_url = not base or any(marker in base for marker in placeholder_markers)
        if needs_url:
            railway_static = os.environ.get("RAILWAY_STATIC_URL", "").strip().rstrip("/")
            railway_host = os.environ.get("RAILWAY_PUBLIC_DOMAIN", "").strip()
            if railway_static:
                object.__setattr__(self, "SITE_BASE_URL", railway_static)
            elif railway_host:
                object.__setattr__(self, "SITE_BASE_URL", f"https://{railway_host}")
        return self

    class Config:
        env_file = ".env"
        extra = "ignore"


# Single settings instance used across the project
settings = Settings()
