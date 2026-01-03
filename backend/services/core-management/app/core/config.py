from cognitest_common import CommonSettings

class Settings(CommonSettings):
    SERVICE_NAME: str = "Core Management Service"
    API_V1_STR: str = "/api/v1"
    
settings = Settings()
