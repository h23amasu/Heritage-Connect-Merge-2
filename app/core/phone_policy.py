"""
Telefonnummer som aldrig får användas i tester eller API-anrop (SMS/geofencing).
"""
import re

# Normaliserade E.164 (+46…) och lokala varianter
BLOCKED_PHONE_NUMBERS = frozenset(
    {
        "+46761104465",
        "46761104465",
        "0761104465",
        "761104465",
    }
)

_LOCAL_SE_PATTERN = re.compile(r"^0(7\d{8})$")


def normalize_phone_key(phone: str) -> str:
    """Enkel normalisering för jämförelse mot blocklist."""
    raw = (phone or "").strip().replace(" ", "").replace("-", "")
    if not raw:
        return ""
    if raw.startswith("+"):
        return raw
    if raw.startswith("00"):
        return "+" + raw[2:]
    match = _LOCAL_SE_PATTERN.match(raw)
    if match:
        return f"+46{match.group(1)}"
    if raw.startswith("46") and len(raw) >= 10:
        return f"+{raw}"
    return raw


def is_blocked_phone(phone: str) -> bool:
    key = normalize_phone_key(phone)
    if not key:
        return False
    if key in BLOCKED_PHONE_NUMBERS:
        return True
    # 0761104465 → +46761104465
    return normalize_phone_key(key) in BLOCKED_PHONE_NUMBERS
