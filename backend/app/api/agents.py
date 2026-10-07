# backend/app/api/agents.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.models.agent import Agent, Task, ExecutionStatus
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("")
async def list_agents(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    result = []
    for a in db.query(Agent).filter(Agent.slug != "marketing").all():
        tasks_today = db.query(func.count(Task.id)).filter(Task.agent_slug == a.slug, Task.created_at >= today).scalar()
        completed = db.query(func.count(Task.id)).filter(Task.agent_slug == a.slug, Task.status == ExecutionStatus.COMPLETED).scalar()
        total = db.query(func.count(Task.id)).filter(Task.agent_slug == a.slug).scalar()
        result.append({"id": str(a.id), "name": a.name, "slug": a.slug, "description": a.description,
                       "status": a.status, "workflow_name": a.workflow_name, "tasks_today": tasks_today,
                       "success_rate": round((completed / max(total, 1)) * 100, 1)})
    return result


@router.get("/{slug}")
async def get_agent(slug: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    a = db.query(Agent).filter(Agent.slug == slug).first()
    if not a:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"id": str(a.id), "name": a.name, "slug": a.slug, "description": a.description, "status": a.status}