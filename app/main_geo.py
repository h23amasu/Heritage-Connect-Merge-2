"""
Geo-microservice (plats, geofencing, närmaste världsarv) – egen IP/port.
Kör: uvicorn app.main_geo:app --host 0.0.0.0 --port 8003
"""
from contextlib import asynccontextmanager

from app.core.microservice_app import create_microservice_app
from app.routers import location, sites, unesco


@asynccontextmanager
async def geo_lifespan(app):
    try:
        from app.services.unesco_service import get_cached_sites, sync_unesco

        cached_count = len(get_cached_sites())
        if cached_count < 50:
            print(f"[geo] UNESCO-cache har {cached_count} platser – synkar …")
            result = sync_unesco(None)
            print(f"[geo] UNESCO-sync klar: {result.get('cached_count', 0)} platser.")
    except Exception as exc:
        print(f"[WARN] UNESCO-sync i geo-tjänsten misslyckades: {exc}")
    yield


app = create_microservice_app(
    service_name="geo",
    description="Geoposition, geofencing och närmaste UNESCO-världsarv.",
    lifespan=geo_lifespan,
)

app.include_router(location.router)
app.include_router(sites.router)
app.include_router(unesco.router)
