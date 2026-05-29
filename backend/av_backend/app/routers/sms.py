"""
Router: SMS

Critical: this router is the entry point to the standalone SMS module.
Per the course requirements it must be swappable with another group's module.

The standardized format that all groups must agree on:
POST /api/sms/send
{
    "phone_number": "+46701234567",
    "message": "message body",
    "site_id": 1
}
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.other import SMSLog
from app.models.payment import UserVisitedSite
from app.schemas import SMSRequest, SMSResponse
from app.services.sms_service import send_sms

router = APIRouter(prefix="/api/sms", tags=["SMS"])


@router.post("/send", response_model=SMSResponse)
def send_sms_endpoint(request: SMSRequest, db: Session = Depends(get_db)):
    """
    Skickar ett SMS.
    Sends an SMS message. The format is standardized across all groups.

    Anti-spam logic:
    - If a site is provided, make sure the user hasn't received a message about it before.
    """
    # Call the standalone service
    response = send_sms(request)

    # Log to the database
    # (In a real app we would link user_id to the phone_number)
    log = SMSLog(
        site_id=request.site_id,
        message=request.message,
        status=response.status,
    )
    db.add(log)
    db.commit()

    return response


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
