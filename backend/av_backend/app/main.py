"""
AV Backend - Application entry point
Projekt: Anpassad Världsarvsinformation (AV)
Kurs: GIK377 - Utveckling av Digitala tjänster
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base

# Import models so SQLAlchemy registers them
from app.models import site, user, subscription, payment, other

# Import routers
from app.routers import sites, users, subscriptions, payments, sms, ai, newspapers


# Create tables in the database (development only - use Alembic in production)
# Base.metadata.create_all(bind=engine)


# Create the application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    Backend API för Anpassad Världsarvsinformation (AV).

    Kund: Dagspressutgivarna AB
    Kurs: GIK377 - Utveckling av Digitala tjänster
    Par 2: Backend & Data

    ## Funktioner
    - World Heritage Sites (med PostGIS för geodata)
    - Användarhantering
    - Prenumerationer (ingen automatisk förnyelse)
    - Betalningar (Mastercard/Visa)
    - SMS-tjänst (modulär mikrotjänst)
    - AI-chatt (endast lokala UNESCO-källor)
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
app.include_router(sms.router)
app.include_router(ai.router)
app.include_router(newspapers.router)


@app.get("/", tags=["Root"])
def root():
    """Entry point - confirms that the backend is running"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "message": "Välkommen till AV Backend! Se /docs för API-dokumentation."
    }


@app.get("/health", tags=["Root"])
def health_check():
    """Health check endpoint - confirms that the service is running"""
    return {"status": "healthy"}
