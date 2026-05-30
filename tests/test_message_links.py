"""Tester för SMS-länkar och integrationskonfig."""
from unittest.mock import patch

from app.services.message_builder import build_near_site_sms, site_detail_url


def test_site_detail_url_uses_configured_base():
    with patch("app.services.message_builder.settings") as settings:
        settings.SITE_BASE_URL = "https://web-production-e43d0.up.railway.app"
        assert site_detail_url("1027", unesco_id="1027") == (
            "https://web-production-e43d0.up.railway.app/sites/1027"
        )


def test_sms_keeps_full_url_with_long_site_name():
    with patch("app.services.message_builder.settings") as settings:
        settings.SITE_BASE_URL = "https://web-production-e43d0.up.railway.app"
        message = build_near_site_sms(
            "Mining Area of the Great Copper Mountain in Falun",
            "1027",
            "sv",
            unesco_id="1027",
            localized_name="Gruvorna i Falun",
        )
        assert "https://web-production-e43d0.up.railway.app/sites/1027" in message
        assert len(message) <= 160
        assert message.endswith("/sites/1027")
