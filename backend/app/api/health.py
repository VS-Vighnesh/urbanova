# backend/app/api/health.py — confirm this exists from Part 1; if not, add it
from fastapi import APIRouter, Depends
from app.config import get_settings

router = APIRouter(prefix="/api", tags=["health"])
settings = get_settings()

@router.get("/health")
async def health():
    return {
        "status": "ok",
        "demo_mode": settings.DEMO_MODE,
        "n8n_connected": bool(settings.N8N_BASE_URL and not settings.DEMO_MODE),
    }