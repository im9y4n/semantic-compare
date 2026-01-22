from typing import List, Union, Optional
from pydantic import AnyHttpUrl, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Semantic Document Monitor"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "vector"
    DATABASE_URI: Optional[str] = None

    @field_validator("DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Union[str, PostgresDsn]:
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=info.data.get("POSTGRES_USER"),
            password=info.data.get("POSTGRES_PASSWORD"),
            host=info.data.get("POSTGRES_SERVER"),
            path=f"{info.data.get('POSTGRES_DB') or ''}",
        ).unicode_string()

    # Storage
    GCS_BUCKET_NAME: str = "documents"
    USE_MINIO: bool = True
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadminpassword"

    # Authentication
    USERINFO_URL: str = "http://dummy-userinfo/userinfo"
    AD_GROUP_MAPPING: dict = {
        "CN=GraphIntell_Admins,OU=Groups,DC=example,DC=com": "admin",
        "CN=GraphIntell_Managers,OU=Groups,DC=example,DC=com": "manager",
        "CN=GraphIntell_Users,OU=Groups,DC=example,DC=com": "viewer"
    }

    # Embedding
    EMBEDDING_PROVIDER: str = "huggingface" # "huggingface" or "google"
    GOOGLE_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

settings = Settings()
