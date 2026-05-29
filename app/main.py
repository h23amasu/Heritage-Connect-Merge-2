"""
Heritage Connect – API (application entry point)
Kurs: GIK377 - Utveckling av Digitala tjänster
Kund (demo): Dagspressutgivarna AB
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.core.database import engine, Base
from app.services.email_service import email_delivery_configured

# Import models so SQLAlchemy registers them
from app.models import site, user, subscription, payment, other


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Skapar databastabeller vid start om AUTO_CREATE_DB_TABLES är aktivt."""
    if settings.AUTO_CREATE_DB_TABLES:
        try:
            Base.metadata.create_all(bind=engine)
        except SQLAlchemyError:
            if not settings.GEOFENCING_DEMO_MODE:
                raise

    if not email_delivery_configured():
        print(
            "[WARN] E-post: MOCK-läge – POST /notification/send-notification med type=email "
            "ger success men skickar inget riktigt mail. Sätt EMAIL_PROVIDER=smtp i .env "
            "(se docs/EMAIL.md)."
        )
    yield

# Import routers
from app.routers import (
    sites,
    users,
    subscriptions,
    payments,
    sms,
    ai,
    newspapers,
    notification,
    location,
    translate,
    unesco,
    auth,
    user_preferences,
    subscription_flow,
)


# Create the application
app = FastAPI(
    lifespan=lifespan,
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    Backend API för Heritage Connect.

    Kund: Dagspressutgivarna AB
    Kurs: GIK377 - Utveckling av Digitala tjänster

    ## Funktioner
    - Gemensamt meddelande-API (SMS/e-post) – kursstandard
    - Översättningstjänst
    - UNESCO-data (cache/sync)
    - Geoposition, geofencing, närmaste världsarv
    - Autentisering (SMS-kod, BankID mock)
    - Prenumeration & betalning (Mastercard/Visa, ingen auto-förnyelse)
    - AI-frågesvar (endast lokala PDF/txt)
    - Tidningsanpassning
    """,
)

# CORS middleware - allows the frontend to connect to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to specific domains in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(sites.router)
app.include_router(users.router)
app.include_router(subscriptions.router)
app.include_router(payments.router)
app.include_router(notification.router)
app.include_router(location.router)
app.include_router(sms.router)
app.include_router(ai.router)
app.include_router(newspapers.router)
app.include_router(translate.router)
app.include_router(unesco.router)
app.include_router(auth.router)
app.include_router(user_preferences.router)
app.include_router(subscription_flow.router)


@app.get("/", tags=["Root"])
def root():
    """Entry point - confirms that the backend is running"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "message": "Välkommen till Heritage Connect API! Se /docs för API-dokumentation."
    }


@app.get("/health", tags=["Root"])
def health_check():
    """Health check endpoint - confirms that the service is running"""
    return {"status": "healthy"}


# Webbapp (Railway / demo) – statiska filer, påverkar inte API-routes ovan
from pathlib import Path

from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

_PROJECT_ROOT = Path(__file__).resolve().parent.parent


@app.get("/demo", include_in_schema=False)
@app.get("/index.html", include_in_schema=False)
def serve_webapp():
    """Prototypen – dela denna länk med läraren/kunden."""
    return FileResponse(_PROJECT_ROOT / "index.html")


@app.get("/sites/{site_ref}", include_in_schema=False)
def serve_site_landing(site_ref: str):
    """Landningssida från SMS-länk – platsinfo, AI och länk till profil."""
    return FileResponse(_PROJECT_ROOT / "site-landing.html")


@app.get("/config.json", include_in_schema=False)
def serve_config():
    config_path = _PROJECT_ROOT / "config.json"
    if config_path.is_file():
        return FileResponse(config_path)
    return {"subscription_price_sek": 49}


if (_PROJECT_ROOT / "css").is_dir():
    app.mount("/css", StaticFiles(directory=_PROJECT_ROOT / "css"), name="css")
if (_PROJECT_ROOT / "js").is_dir():
    app.mount("/js", StaticFiles(directory=_PROJECT_ROOT / "js"), name="js")
if (_PROJECT_ROOT / "data").is_dir():
    app.mount("/data", StaticFiles(directory=_PROJECT_ROOT / "data"), name="data")
