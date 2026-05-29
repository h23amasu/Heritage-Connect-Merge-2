"""
Router: Shared notification API (course standard).

POST /notification/send-notification
"""
from fastapi import APIRouter, BackgroundTasks
from fastapi.responses import JSONResponse

from app.schemas import NotificationRequest
from app.services.notification_service import (
    check_cooldown,
    dispatch_notification,
    record_cooldown,
    validate_notification_request,
    ERROR_COOLDOWN,
)

router = APIRouter(prefix="/notification", tags=["Notifications"])


@router.post("/send-notification")
def send_notification(
    request: NotificationRequest,
    background_tasks: BackgroundTasks,
):
    """
    Skickar SMS eller e-post asynkront.
    Leverantörsoberoende svar enligt kursöverenskommelse.
    """
    error_code = validate_notification_request(request)
    if error_code:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": error_code},
        )

    if check_cooldown(request):
        return JSONResponse(
            status_code=429,
            content={"success": False, "error": ERROR_COOLDOWN},
        )

    record_cooldown(request)
    background_tasks.add_task(dispatch_notification, request)

    return {"success": True, "channel": request.type}
