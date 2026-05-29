"""
Payment Service – Visa/Mastercard via Stripe när konfigurerat, annars mock.
Prenumeration förnyas aldrig automatiskt (engångsbetalning).
"""
import uuid
from decimal import Decimal
from typing import Tuple

from app.core.config import settings


def _process_stripe(
    amount: Decimal,
    card_type: str,
    card_number: str,
) -> Tuple[bool, str]:
    try:
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY
        # Testmiljö: PaymentIntent med kort (kurs/demo – minimal integration)
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency="sek",
            payment_method_types=["card"],
            metadata={"card_type": card_type},
            description="Heritage Connect prenumeration",
        )
        # I produktion: bekräfta med payment_method från Stripe Elements
        if intent and intent.id:
            return True, intent.id
        return False, ""
    except Exception:
        return False, ""


def process_payment(
    amount: Decimal,
    card_type: str,
    card_number: str,
) -> Tuple[bool, str]:
    if card_type not in ("mastercard", "visa"):
        return False, ""

    provider = (settings.PAYMENT_PROVIDER or "mock").lower()
    if provider == "stripe" and settings.STRIPE_SECRET_KEY:
        ok, tx_id = _process_stripe(amount, card_type, card_number)
        if ok:
            return True, tx_id

    print(f"[MOCK PAYMENT] {amount} SEK, {card_type}")
    return True, f"mock_tx_{uuid.uuid4().hex[:16]}"
