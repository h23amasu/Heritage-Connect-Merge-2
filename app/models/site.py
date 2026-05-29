"""
Model: World Heritage Site
Represents a single UNESCO site together with its geographic coordinates.
"""
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geography

from app.core.database import Base


class WorldHeritageSite(Base):
    __tablename__ = "world_heritage_sites"

    id = Column(Integer, primary_key=True, index=True)
    unesco_id = Column(String(50), unique=True, index=True)  # Official ID from UNESCO
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    country = Column(String(100))

    # Geographic coordinates - PostGIS POINT
    # Allows fast distance calculations and "nearest site" lookups.
    location = Column(Geography(geometry_type="POINT", srid=4326))

    image_url = Column(Text)
    category = Column(String(50))  # Cultural / Natural / Mixed
    year_inscribed = Column(Integer)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
