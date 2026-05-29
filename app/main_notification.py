"""
Meddelande-microservice (SMS/e-post) – egen IP/port.
Kör: uvicorn app.main_notification:app --host 0.0.0.0 --port 8001
"""
from app.core.microservice_app import create_microservice_app
from app.routers import notification, sms

app = create_microservice_app(
    service_name="notification",
    description="Gemensamt meddelande-API (SMS/e-post) enligt kursstandard.",
)

app.include_router(notification.router)
app.include_router(sms.router)
