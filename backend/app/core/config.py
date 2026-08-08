from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkillGap AI"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "skillgap-ai-super-2026-veera"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    GROQ_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
