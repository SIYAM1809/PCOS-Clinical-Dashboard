from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    HF_TOKEN: str
    HF_REPO_ID: str = "SIYAM1809/pcos-clinical-ensemble"
    MODEL_CACHE_DIR: str = "./model_cache_v2"
    APP_NAME: str = "PCOS Clinical Dashboard"
    VERSION: str = "1.0.0"

    class Config:
        env_file = "../.env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()
