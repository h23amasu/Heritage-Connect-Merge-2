"""
Router: Newspapers
Handles newspaper configuration - each newspaper can use the service
with its own customization.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.other import Newspaper
from app.schemas import NewspaperResponse

router = APIRouter(prefix="/api/newspapers", tags=["Newspapers"])


@router.get("/{newspaper_id}/config", response_model=NewspaperResponse)
def get_newspaper_config(newspaper_id: int, db: Session = Depends(get_db)):
    """
    Hämtar visuell konfiguration för en tidning.
    Returns a newspaper's settings (colors, logo, language) - used by the
    frontend to customize the ad.
    """
    newspaper = db.query(Newspaper).filter(Newspaper.id == newspaper_id).first()
    if not newspaper:
        raise HTTPException(status_code=404, detail="Newspaper not found")
    return newspaper


@router.get("/", response_model=list[NewspaperResponse])
def list_newspapers(db: Session = Depends(get_db)):
    """Returns the list of all registered newspapers."""
    return db.query(Newspaper).all()
