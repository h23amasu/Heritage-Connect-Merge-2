"""
BankID – mock (demo) eller riktig RP-integration via pybankid (API v6).
"""
from __future__ import annotations

import secrets
import tempfile
import time
from pathlib import Path
from typing import Any, Optional

from app.core.config import settings

_order_meta: dict[str, dict[str, Any]] = {}
_client: Any = None


def bankid_configured() -> bool:
    return (settings.BANKID_PROVIDER or "mock").lower() == "bankid"


def bankid_public_config() -> dict:
    configured = bankid_configured()
    return {
        "success": True,
        "provider": settings.BANKID_PROVIDER or "mock",
        "bankid_enabled": configured,
        "bankid_mock": not configured,
        "bankid_test_server": bool(settings.BANKID_TEST_SERVER),
    }


def _resolve_cert_paths() -> tuple[str, str]:
    cert_file = (settings.BANKID_CERT_FILE or "").strip()
    key_file = (settings.BANKID_KEY_FILE or "").strip()
    if cert_file and key_file and Path(cert_file).is_file() and Path(key_file).is_file():
        return cert_file, key_file

    cert_pem = (settings.BANKID_CERT_PEM or "").replace("\\n", "\n").strip()
    key_pem = (settings.BANKID_KEY_PEM or "").replace("\\n", "\n").strip()
    if cert_pem and key_pem:
        cert_dir = Path(tempfile.gettempdir()) / "heritage-bankid"
        cert_dir.mkdir(parents=True, exist_ok=True)
        cert_path = cert_dir / "cert.pem"
        key_path = cert_dir / "key.pem"
        cert_path.write_text(cert_pem + "\n", encoding="utf-8")
        key_path.write_text(key_pem + "\n", encoding="utf-8")
        return str(cert_path), str(key_path)

    if settings.BANKID_TEST_SERVER:
        import bankid

        cert_dir = Path(tempfile.gettempdir()) / "heritage-bankid"
        cert_dir.mkdir(parents=True, exist_ok=True)
        cert_path = cert_dir / "certificate.pem"
        key_path = cert_dir / "key.pem"
        if not cert_path.is_file() or not key_path.is_file():
            bankid.create_bankid_test_server_cert_and_key(str(cert_dir))
        return str(cert_path), str(key_path)

    raise RuntimeError(
        "BankID is enabled but no certificate is configured. "
        "Set BANKID_CERT_FILE/BANKID_KEY_FILE or BANKID_CERT_PEM/BANKID_KEY_PEM."
    )


def _get_client():
    global _client
    if _client is not None:
        return _client

    from bankid import BankIDClient

    cert, key = _resolve_cert_paths()
    _client = BankIDClient(
        certificates=(cert, key),
        test_server=bool(settings.BANKID_TEST_SERVER),
    )
    return _client


def _launch_url(auto_start_token: str) -> str:
    return f"https://app.bankid.com/?autostarttoken={auto_start_token}&redirect=null"


def mock_start() -> dict:
    order_ref = secrets.token_hex(16)
    return {
        "success": True,
        "mock": True,
        "method": "bankid",
        "order_ref": order_ref,
        "auto_start_token": None,
        "bankid_launch_url": None,
        "message": "BankID mock – bekräftas automatiskt.",
    }


def _format_bankid_error(exc: Exception) -> str:
    message = str(exc)
    if "Expecting value" in message or "JSONDecodeError" in type(exc).__name__:
        return (
            "BankID-servern avvisade anslutningen. Auto-genererat testcert räcker inte – "
            "ni behöver RP-certifikat från BankID Demo Bank, eller sätt BANKID_PROVIDER=mock för demo."
        )
    if "403" in message or "Forbidden" in message:
        return (
            "BankID avvisade certifikatet (403). Skaffa testcert via BankID Demo Bank "
            "(demo.bankid.com), eller kör BANKID_PROVIDER=mock tills dess."
        )
    return f"BankID error: {exc}"


def start_auth(end_user_ip: str) -> dict:
    if not bankid_configured():
        return mock_start()

    try:
        client = _get_client()
        response = client.authenticate(
            end_user_ip=end_user_ip,
            user_visible_data="Logga in på Heritage Connect",
        )
    except Exception as exc:
        raise RuntimeError(_format_bankid_error(exc)) from exc

    order_ref = response["orderRef"]
    _order_meta[order_ref] = {
        "qr_start_token": response.get("qrStartToken"),
        "qr_start_secret": response.get("qrStartSecret"),
        "start_time": int(time.time()),
    }
    auto_token = response.get("autoStartToken", "")
    return {
        "success": True,
        "mock": False,
        "method": "bankid",
        "order_ref": order_ref,
        "auto_start_token": auto_token,
        "qr_start_token": response.get("qrStartToken"),
        "bankid_launch_url": _launch_url(auto_token) if auto_token else None,
        "message": "Öppna BankID-appen och godkänn inloggningen.",
    }


def get_qr_content(order_ref: str) -> Optional[str]:
    meta = _order_meta.get(order_ref)
    if not meta or not meta.get("qr_start_token") or not meta.get("qr_start_secret"):
        return None

    from bankid.qr import generate_qr_code_content

    return generate_qr_code_content(
        meta["qr_start_token"],
        meta["start_time"],
        meta["qr_start_secret"],
    )


def collect_order(order_ref: str, issue_session) -> dict:
    if not order_ref:
        return {"status": "failed", "error": "invalid_order_ref"}

    if not bankid_configured():
        token = issue_session(f"bankid:{order_ref[:8]}")
        return {
            "status": "complete",
            "access_token": token,
            "user_id": "bankid_user",
            "name": "BankID Demo",
            "mock": True,
        }

    client = _get_client()
    result = client.collect(order_ref=order_ref)
    status = result.get("status")

    if status == "complete":
        user = result.get("completionData", {}).get("user", {})
        personal_number = user.get("personalNumber") or "bankid_user"
        name = user.get("name") or ""
        token = issue_session(personal_number)
        _order_meta.pop(order_ref, None)
        return {
            "status": "complete",
            "access_token": token,
            "user_id": personal_number,
            "name": name,
            "mock": False,
        }

    if status == "failed":
        hint = result.get("hintCode") or "failed"
        _order_meta.pop(order_ref, None)
        return {"status": "failed", "error": hint}

    return {
        "status": "pending",
        "hint_code": result.get("hintCode"),
    }
