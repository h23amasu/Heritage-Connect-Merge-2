"""
Payment Service

Per the client's requirements:
- Only Mastercard and Visa
- The subscription must not auto-renew
- Keep it as simple as possible (Joakim's advice)
"""
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Tuple


def process_payment(
    amount: Decimal,
    card_type: str,
    card_number: str,
) -> Tuple[bool, str]:
    """
    Process a payment (currently mocked).

    In production: replace this with Stripe or another real solution.

    Returns:
        tuple (success, transaction_id)
    """
    # Validate the card type
    if card_type not in ["mastercard", "visa"]:
        return False, ""

    # Simulate payment processing
    # In reality this is where we would call the Stripe API
    print(f"💳 [MOCK PAYMENT] Processing payment of {amount} SEK")
    print(f"💳 [MOCK PAYMENT] Card type: {card_type}")

    # Generate a fake transaction_id
    transaction_id = f"mock_tx_{uuid.uuid4().hex[:16]}"

    # The mock always treats the payment as successful
    return True, transaction_id
