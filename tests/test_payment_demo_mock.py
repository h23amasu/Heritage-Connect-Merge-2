"""Mock-betalning med 4242… ska fungera i demo även om Stripe-nycklar finns."""
from decimal import Decimal
from unittest.mock import patch

from app.services.payment_service import mock_payment_allowed, process_payment


def test_mock_payment_allowed_in_demo_with_stripe_keys():
    with patch("app.services.payment_service.settings") as settings:
        settings.PAYMENT_PROVIDER = "stripe"
        settings.STRIPE_SECRET_KEY = "sk_test_example"
        settings.GEOFENCING_DEMO_MODE = True
        settings.PAYMENT_DEMO_USE_MOCK = True
        assert mock_payment_allowed() is True


def test_process_payment_accepts_test_card_in_demo():
    with patch("app.services.payment_service.settings") as settings:
        settings.PAYMENT_PROVIDER = "stripe"
        settings.STRIPE_SECRET_KEY = "sk_test_example"
        settings.GEOFENCING_DEMO_MODE = True
        settings.PAYMENT_DEMO_USE_MOCK = True

        ok, tx_id = process_payment(
            Decimal("99"),
            "visa",
            "4242424242424242",
        )

        assert ok is True
        assert tx_id.startswith("mock_tx_")
