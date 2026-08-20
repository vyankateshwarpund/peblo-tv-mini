
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Peblo TV Mini"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = Field(
        default="sqlite:///./peblo_local.db",
        validation_alias="DATABASE_URL"
    )

    JWT_SECRET: str = Field(
        default="super-secret-jwt-key-for-development-change-in-production-12345",
        validation_alias="JWT_SECRET"
    )
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440

    STORAGE_PATH: str = Field(default="./storage", validation_alias="STORAGE_PATH")
    CATALOGUE_PATH: str = Field(default="./storage/catalogue.json", validation_alias="CATALOGUE_PATH")

    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174",
        validation_alias="CORS_ORIGINS"
    )

    ADMIN_EMAIL: str = Field(default="admin@example.com", validation_alias="ADMIN_EMAIL")
    ADMIN_PASSWORD: str = Field(default="adminpassword123", validation_alias="ADMIN_PASSWORD")
    EDITOR_EMAIL: str = Field(default="editor@example.com", validation_alias="EDITOR_EMAIL")
    EDITOR_PASSWORD: str = Field(default="editorpassword123", validation_alias="EDITOR_PASSWORD")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=[".env", "../.env", "../../.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
