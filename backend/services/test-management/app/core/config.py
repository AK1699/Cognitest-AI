from cognitest_common import CommonSettings

class Settings(CommonSettings):
    SERVICE_NAME: str = "Test Management Service"
    PORT: int = 8003

settings = Settings()
