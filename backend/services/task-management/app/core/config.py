from cognitest_common.config import CommonSettings
from pydantic_settings import SettingsConfigDict

class Settings(CommonSettings):
    SERVICE_NAME: str = "Task Management Service"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "0.1.0"
    
    # Celery specific overrides if any
    CELERY_WORKER_NAME: str = "task_management_worker"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="allow"
    )

settings = Settings()
