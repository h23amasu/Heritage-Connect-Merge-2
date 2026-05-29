"""
Router: Users
Handles user registration and management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas import UserCreate, UserResponse

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrerar en ny användare.
    Registers a new user.
    """
    # Make sure the phone number isn't already registered
    existing = db.query(User).filter(User.phone_number == user_data.phone_number).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Phone number is already registered"
        )

    new_user = User(
        phone_number=user_data.phone_number,
        email=user_data.email,
        preferred_language=user_data.preferred_language,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Hämtar en användare.
    Returns user information.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    language: str = None,
    email: str = None,
    db: Session = Depends(get_db)
):
    """
    Uppdaterar användarinformation.
    Updates user information.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if language:
        user.preferred_language = language
    if email:
        user.email = email

    db.commit()
    db.refresh(user)
    return user
