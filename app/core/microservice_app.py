"""Gemensam fabrik för fristående Heritage Connect-microservices."""
from contextlib import asynccontextmanager
from typing import Callable, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


def create_microservice_app(
    *,
    service_name: str,
    description: str,
    lifespan: Optional[Callable] = None,
) -> FastAPI:
    app = FastAPI(
        title=f"{settings.APP_NAME} – {service_name}",
        version=settings.APP_VERSION,
        description=description,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["Root"])
    def root():
        return {
            "app": settings.APP_NAME,
            "service": service_name,
            "version": settings.APP_VERSION,
            "status": "running",
            "docs": "/docs",
        }

    @app.get("/health", tags=["Root"])
    def health_check():
        return {"status": "healthy", "service": service_name}

    return app
