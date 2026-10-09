import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Dan AI Engine Microservice"
    VERSION: str = "2.0.0"
    API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
    
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://dan-qdrant:6333")
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://dan-ollama:11434")
    OPENCLAW_URL: str = os.getenv("OPENCLAW_URL", "http://openclaw:4000")

    class Config:
        case_sensitive = True

settings = Settings()
