"""Kör: python scripts/diagnose-hellosms.py"""
import sys
sys.path.insert(0, ".")

from app.core.config import settings
from app.services.hellosms_client import HelloSMSError, send_sms_via_hellosms

print("=== HelloSMS-diagnos ===")
print("SMS_PROVIDER:", settings.SMS_PROVIDER)
print("API_USER:", settings.HELLOSMS_API_USERNAME[:6] + "..." if settings.HELLOSMS_API_USERNAME else "(tom)")
print("SENDER:", settings.HELLOSMS_SENDER)
print("TEST_MODE:", settings.HELLOSMS_TEST_MODE)

if settings.HELLOSMS_API_USERNAME.startswith("ditt_api"):
    print("\nFEL: .env har fortfarande platshållare (ditt_api_...).")
    print("Kopiera riktiga uppgifter från dashboard.hellosms.se till .env")
    sys.exit(1)

try:
    data = send_sms_via_hellosms(
        "+46738100354",
        "Diagnostest fran Heritage Connect",
        subject="diagnose",
    )
    print("\nOK:", data.get("statusText"))
    for mid in data.get("messageIds") or []:
        print(f"  -> {mid.get('to')} status={mid.get('status')} id={mid.get('apiMessageId')}")
    if settings.HELLOSMS_TEST_MODE:
        print("\nOBS: TEST_MODE=true – inget SMS skickas till mobilen.")
    else:
        print("\nSMS skickat (om status=0). Kolla +46738100354.")
except HelloSMSError as exc:
    print("\nFEL:", exc)
    sys.exit(1)
