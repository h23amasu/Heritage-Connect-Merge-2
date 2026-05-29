"""
Fyll databasen med världsarv från UNESCO-cache/sample.
Kör: python scripts/seed_data.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.database import SessionLocal
from app.services.unesco_service import sync_unesco


def main():
    db = SessionLocal()
    try:
        result = sync_unesco(db)
        print("Seed klar:", result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
