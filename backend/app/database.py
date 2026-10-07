# backend/app/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_lead_tracking_schema() -> None:
    """Add lead-tracking columns to databases created before those fields existed."""
    with engine.begin() as connection:
        connection.execute(text("""
            ALTER TABLE leads
                ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS order_click_count INTEGER NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS browsed_products JSONB NOT NULL DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS first_visited_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ,
                ADD COLUMN IF NOT EXISTS user_intent_notes TEXT
        """))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()