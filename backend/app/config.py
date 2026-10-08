# backend/app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://urbanova:urbanova_password_2025@localhost:5432/urbanova_db"

    # JWT Auth
    JWT_SECRET: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Demo Mode
    DEMO_MODE: bool = True
    DEMO_OWNER_EMAIL: str = "owner@urbanova.demo"
    DEMO_CUSTOMER_EMAIL: str = "customer@urbanova.demo"
    DEMO_PASSWORD: str = "demo1234"

    # n8n
    N8N_BASE_URL: str = "http://localhost:5678"
    N8N_API_KEY: str = ""
    N8N_ORCHESTRATOR_WEBHOOK: str = ""
    N8N_SUPPORT_WEBHOOK: str = ""
    N8N_SALES_WEBHOOK: str = ""
    N8N_MARKETING_WEBHOOK: str = ""
    N8N_HR_WEBHOOK: str = ""
    N8N_INVOICE_WEBHOOK: str = ""

    # Support email delivery (Gmail SMTP supports an app password)
    SUPPORT_EMAIL: str = "holahoal3311@gmail.com"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_USE_SSL: bool = False

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()