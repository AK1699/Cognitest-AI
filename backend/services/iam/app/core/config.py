from cognitest_common import CommonSettings
import os

class IAMSettings(CommonSettings):
    """Specific settings for the IAM service."""
    SERVICE_NAME: str = "IAM Service"
    
    # OAuth Settings (Extracted from old monolith config)
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    
    # IAM specific database if different (defaulting to common for now)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://postgres:postgres@localhost:5432/cognitest"
    )

settings = IAMSettings()
