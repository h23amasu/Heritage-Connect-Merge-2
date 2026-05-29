"""
Project settings - reads from environment variables or the .env file
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = "postgresql://av_user:av_password@localhost:5432/av_database"

    # Application settings
    APP_NAME: str = "AV Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # SMS settings
    SMS_PROVIDER: str = "mock"  # mock or twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # AI settings
    AI_PROVIDER: str = "mock"  # mock, openai or ollama
    OPENAI_API_KEY: str = ""

    # Payment settings
    PAYMENT_PROVIDER: str = "mock"  # mock or stripe
    STRIPE_SECRET_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


# Single settings instance used across the project
settings = Settings()
