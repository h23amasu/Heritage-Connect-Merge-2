"""
PostgreSQL database connection setup with SQLAlchemy
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

_connect_args = (
    {"check_same_thread": False}
    if settings.DATABASE_URL.startswith("sqlite")
    else {}
)

# Database engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    connect_args=_connect_args,
)

# Session factory - each request gets its own session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all models inherit from
Base = declarative_base()


def get_db():
    """
    Helper function used in endpoints to obtain a database session.
    Closes automatically after use.

    Usage:
        @app.get("/sites")
        def get_sites(db: Session = Depends(get_db)):
            return db.query(Site).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
