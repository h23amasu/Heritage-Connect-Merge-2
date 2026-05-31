"""
Payment Service – Visa/Mastercard via Stripe när konfigurerat, annars mock.
Prenumeration förnyas aldrig automatiskt (engångsbetalning).
"""
import uuid
from decimal import Decimal
from typing import Optional, Tuple

from app.core.config import settings


def stripe_configured() -> bool:
    provider = (settings.PAYMENT_PROVIDER or "mock").lower()
    return provider == "stripe" and bool(settings.STRIPE_SECRET_KEY)


def mock_payment_allowed() -> bool:
    """Demo/testkort (4242…) när Stripe inte ska användas i checkout."""
    provider = (settings.PAYMENT_PROVIDER or "mock").lower()
    if provider != "stripe" or not settings.STRIPE_SECRET_KEY:
        return True
    return settings.GEOFENCING_DEMO_MODE and settings.PAYMENT_DEMO_USE_MOCK


def create_stripe_payment_intent(
    amount: Decimal,
    metadata: Optional[dict] = None,
) -> Tuple[str, str]:
    """Skapar PaymentIntent och returnerar (client_secret, payment_intent_id)."""
    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY
    intent = stripe.PaymentIntent.create(
        amount=int(float(amount) * 100),
        currency="sek",
        automatic_payment_methods={"enabled": True},
        metadata=metadata or {},
        description="Heritage Connect prenumeration",
    )
    if not intent.client_secret or not intent.id:
        raise RuntimeError("Stripe PaymentIntent saknar client_secret")
    return intent.client_secret, intent.id


def verify_stripe_payment_intent(
    payment_intent_id: str,
    expected_amount: Optional[Decimal] = None,
) -> Tuple[bool, str]:
    """Verifierar att PaymentIntent är succeeded (och valfritt belopp)."""
    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
    except Exception as exc:
        raise ValueError(f"Stripe error: {exc}") from exc
    if intent.status != "succeeded":
        return False, ""
    if expected_amount is not None and int(intent.amount) != int(expected_amount * 100):
        return False, ""
    return True, intent.id


def process_payment(
    amount: Decimal,
    card_type: str,
    card_number: str,
    payment_intent_id: Optional[str] = None,
) -> Tuple[bool, str]:
    if payment_intent_id:
        if not stripe_configured():
            return False, ""
        expected = amount if amount and amount > 0 else None
        try:
            return verify_stripe_payment_intent(payment_intent_id, expected)
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError(f"Stripe error: {exc}") from exc

    if card_type not in ("mastercard", "visa"):
        return False, ""

    if stripe_configured() and not mock_payment_allowed():
        return False, ""

    print(f"[MOCK PAYMENT] {amount} SEK, {card_type}")
    return True, f"mock_tx_{uuid.uuid4().hex[:16]}"
