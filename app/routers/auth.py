"""
Router: Autentisering – SMS-kod, e-postkod och BankID.
"""
import logging

from fastapi import APIRouter, BackgroundTasks, Query, Request
from fastapi.responses import JSONResponse

from app.schemas import (
    AuthRequestCodeRequest,
    AuthRequestEmailCodeRequest,
    AuthTokenResponse,
    AuthVerifyCodeRequest,
    AuthVerifyEmailCodeRequest,
    BankIdCollectRequest,
    BankIdCollectResponse,
    BankIdCompleteRequest,
)
from app.services.auth_service import (
    bankid_collect,
    bankid_complete,
    bankid_qr_content,
    bankid_start_for_ip,
    request_email_code,
    request_sms_code,
    verify_email_code,
    verify_sms_code,
)
from app.services.bankid_service import bankid_public_config
from app.services.notification_service import dispatch_notification

router = APIRouter(prefix="/api/auth", tags=["Auth"])
logger = logging.getLogger(__name__)


def _dispatch_login_code(notification) -> None:
    try:
        dispatch_notification(notification)
    except Exception:
        logger.exception(
            "Kunde inte skicka inloggningskod till %s – koden finns sparad lokalt",
            notification.to,
        )


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


@router.get("/bankid/config")
def bankid_config_endpoint():
    """Publikt BankID-läge för frontend."""
    return bankid_public_config()


@router.post("/request-code")
def request_code(body: AuthRequestCodeRequest, background_tasks: BackgroundTasks):
    """Skickar engångskod via SMS (gemensamt notification-API)."""
    ok, err, dev_code, notification = request_sms_code(body.phone)
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
    if notification:
        background_tasks.add_task(_dispatch_login_code, notification)
    resp = {"success": True, "message": "Kod skickad via SMS"}
    if body.purpose:
        resp["purpose"] = body.purpose
    return resp


@router.post("/request-email-code")
def request_email_code_endpoint(
    body: AuthRequestEmailCodeRequest,
    background_tasks: BackgroundTasks,
):
    """Skickar engångskod via e-post (för icke-svenska användare)."""
    ok, err, _dev_code, notification = request_email_code(body.email)
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
    if notification:
        background_tasks.add_task(_dispatch_login_code, notification)
    resp = {"success": True, "message": "Kod skickad via e-post"}
    if body.purpose:
        resp["purpose"] = body.purpose
    return resp


@router.post("/verify-code", response_model=AuthTokenResponse)
def verify_code(body: AuthVerifyCodeRequest):
    ok, err, token = verify_sms_code(body.phone, body.code)
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
    return AuthTokenResponse(
        success=True,
        access_token=token,
        user_id=body.phone,
        method="sms",
    )


@router.post("/verify-email-code", response_model=AuthTokenResponse)
def verify_email_code_endpoint(body: AuthVerifyEmailCodeRequest):
    ok, err, token = verify_email_code(body.email, body.code)
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
    return AuthTokenResponse(
        success=True,
        access_token=token,
        user_id=body.email.strip().lower(),
        method="email",
    )


@router.post("/bankid/start")
def bankid_start_endpoint(request: Request):
    """Startar BankID-inloggning (mock eller riktig RP)."""
    try:
        return bankid_start_for_ip(_client_ip(request))
    except RuntimeError as exc:
        return JSONResponse(status_code=503, content={"success": False, "error": str(exc)})
    except Exception as exc:
        return JSONResponse(
            status_code=502,
            content={"success": False, "error": f"BankID error: {exc}"},
        )


@router.get("/bankid/qr")
def bankid_qr_endpoint(order_ref: str = Query(..., min_length=8)):
    """QR-innehåll för BankID på annan enhet (uppdateras varje sekund)."""
    content = bankid_qr_content(order_ref)
    if not content:
        return JSONResponse(status_code=404, content={"success": False, "error": "order_not_found"})
    return {"success": True, "order_ref": order_ref, "qr_content": content}


@router.post("/bankid/collect", response_model=BankIdCollectResponse)
def bankid_collect_endpoint(body: BankIdCollectRequest):
    """Polla BankID-order tills complete/failed (max en gång/sek)."""
    try:
        result = bankid_collect(body.order_ref)
    except Exception as exc:
        return JSONResponse(
            status_code=502,
            content={"success": False, "error": f"BankID error: {exc}"},
        )
    return BankIdCollectResponse(**result)


@router.post("/bankid/complete", response_model=AuthTokenResponse)
def bankid_complete_endpoint(body: BankIdCompleteRequest):
    ok, err, token, user_id = bankid_complete(body.order_ref)
    if err == "pending":
        return JSONResponse(
            status_code=409,
            content={"success": False, "error": "pending", "status": "pending"},
        )
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
    return AuthTokenResponse(
        success=True,
        access_token=token,
        user_id=user_id or "bankid_user",
        method="bankid",
    )
