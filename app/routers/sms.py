"""
Router: SMS (legacy)

Prefer POST /notification/send-notification with type=sms for cross-group compatibility.
"""
from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.other import SMSLog
from app.schemas import SMSRequest, NotificationRequest
from app.services.notification_service import (
    dispatch_notification,
    record_cooldown,
    validate_notification_request,
)
from app.services.cooldown_service import cooldown_service

router = APIRouter(prefix="/api/sms", tags=["SMS"])


@router.post("/send")
def send_sms_endpoint(
    request: SMSRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Legacy SMS-endpoint. Samma svar som POST /notification/send-notification (utan leverantör).
    """
    notification = NotificationRequest(
        type="sms",
        to=request.phone_number,
        message=request.message,
        site_id=str(request.site_id) if request.site_id else None,
    )
    error_code = validate_notification_request(notification)
    if error_code:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": error_code},
        )

    if cooldown_service.is_on_cooldown(
        "sms", request.phone_number, site_id=str(request.site_id or "")
    ):
        return JSONResponse(
            status_code=429,
            content={"success": False, "error": "cooldown"},
        )

    record_cooldown(notification)
    background_tasks.add_task(dispatch_notification, notification)

    try:
        log = SMSLog(
            site_id=request.site_id,
            message=request.message,
            status="queued",
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

    return {"success": True, "channel": "sms"}


@router.get("/logs")
def get_sms_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Hämtar historik över skickade SMS.
    Returns the log of every SMS that has been sent.
    """
    logs = db.query(SMSLog).order_by(SMSLog.sent_at.desc()).offset(skip).limit(limit).all()
    return logs
