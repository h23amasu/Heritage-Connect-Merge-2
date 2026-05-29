"""
Översättnings-microservice – egen IP/port.
Kör: uvicorn app.main_translate:app --host 0.0.0.0 --port 8002
"""
from app.core.microservice_app import create_microservice_app
from app.routers import translate

app = create_microservice_app(
    service_name="translate",
    description="Översättningstjänst för tidningsspråk och notiser.",
)

app.include_router(translate.router)
