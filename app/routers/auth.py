"""
Router: Autentisering – SMS-kod, e-postkod och BankID (mock).
"""
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.schemas import (
    AuthRequestCodeRequest,
    AuthRequestEmailCodeRequest,
    AuthTokenResponse,
    AuthVerifyCodeRequest,
    AuthVerifyEmailCodeRequest,
    BankIdCompleteRequest,
)
from app.services.auth_service import (
    bankid_complete,
    bankid_start,
    request_email_code,
    request_sms_code,
    verify_email_code,
    verify_sms_code,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/request-code")
def request_code(body: AuthRequestCodeRequest):
    """Skickar engångskod via SMS (gemensamt notification-API)."""
    ok, err, dev_code = request_sms_code(body.phone)
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
    resp = {"success": True, "message": "Kod skickad via SMS"}
    if body.purpose:
        resp["purpose"] = body.purpose
    return resp


@router.post("/request-email-code")
def request_email_code_endpoint(body: AuthRequestEmailCodeRequest):
    """Skickar engångskod via e-post (för icke-svenska användare)."""
    ok, err, _dev_code = request_email_code(body.email)
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
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
def bankid_start_endpoint():
    """Startar BankID-flöde (mock för kurs/demo)."""
    return bankid_start()


@router.post("/bankid/complete", response_model=AuthTokenResponse)
def bankid_complete_endpoint(body: BankIdCompleteRequest):
    ok, err, token = bankid_complete(body.order_ref)
    if not ok:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": err},
        )
    return AuthTokenResponse(
        success=True,
        access_token=token,
        user_id="bankid_user",
        method="bankid",
    )
