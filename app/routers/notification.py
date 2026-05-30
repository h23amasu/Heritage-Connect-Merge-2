"""
Router: Shared notification API (course standard).

POST /api/notification/send
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

router = APIRouter(prefix="/api/notification", tags=["Notifications"])
legacy_router = APIRouter(prefix="/notification", tags=["Notifications (legacy)"])


def _handle_send_notification(
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

    return {"success": True, "channel": request.channel}


@router.post("/send")
def send_notification(
    request: NotificationRequest,
    background_tasks: BackgroundTasks,
):
    """Gemensam kursstandard – POST /api/notification/send med fältet channel."""
    return _handle_send_notification(request, background_tasks)


@legacy_router.post("/send-notification", include_in_schema=False)
def send_notification_legacy(
    request: NotificationRequest,
    background_tasks: BackgroundTasks,
):
    """Legacy – accepterar type eller channel. Använd /api/notification/send."""
    return _handle_send_notification(request, background_tasks)
