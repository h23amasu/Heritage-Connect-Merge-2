"""
AI-fråge-microservice – egen IP/port.
Kör: uvicorn app.main_ai:app --host 0.0.0.0 --port 8004
"""
from contextlib import asynccontextmanager

from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import Base, engine
from app.core.microservice_app import create_microservice_app
from app.models import other, site, subscription, user  # noqa: F401
from app.routers import ai


@asynccontextmanager
async def ai_lifespan(app):
    if settings.AUTO_CREATE_DB_TABLES:
        try:
            Base.metadata.create_all(bind=engine)
        except SQLAlchemyError:
            if not settings.GEOFENCING_DEMO_MODE:
                raise
    yield


app = create_microservice_app(
    service_name="ai",
    description="AI-frågesvar från lokala UNESCO-källor (PDF/txt).",
    lifespan=ai_lifespan,
)

app.include_router(ai.router)
