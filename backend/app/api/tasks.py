# backend/app/api/tasks.py
import uuid
import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.agent import Task, AgentExecution, ExecutionStatus
from app.models.user import User
from app.config import get_settings
from app.services.n8n_service import n8n_service
from app.services.demo_service import demo_service
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])
settings = get_settings()


class CreateTaskRequest(BaseModel):
    title: str
    description: str
    priority: str = "MEDIUM"


def _task_number() -> str:
    return "TASK-" + uuid.uuid4().hex[:8].upper()


@router.post("")
async def create_task(
    body: CreateTaskRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = Task(
        task_number=_task_number(),
        title=body.title,
        description=body.description,
        priority=body.priority,
        status=ExecutionStatus.QUEUED,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    background_tasks.add_task(_run_orchestrator, str(task.id), settings.DATABASE_URL)
    return {"id": str(task.id), "task_number": task.task_number, "status": task.status}


async def _run_orchestrator(task_id: str, db_url: str):
    """Runs in the background. Records an AgentExecution for every hop, and
    always ends the task in COMPLETED / AWAITING_APPROVAL / FAILED — never
    leaves it stuck at RUNNING."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return

        task.status = ExecutionStatus.RUNNING
        db.commit()

        execution = AgentExecution(
            task_id=task.id,
            agent_slug="orchestrator",
            workflow_name="Business_Orchestrator",
            status="RUNNING",
            input={"title": task.title, "description": task.description, "priority": task.priority},
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)

        started = time.time()
        try:
            if settings.DEMO_MODE:
                result = await demo_service.orchestrator_response(task.description, task.task_number)
            else:
                result = await n8n_service.trigger_orchestrator(task.task_number, task.description, task.priority)
        except Exception as exc:
            execution.status = "FAILED"
            execution.error = str(exc)
            execution.execution_time = round(time.time() - started, 2)
            execution.completed_at = datetime.now(timezone.utc)
            task.status = ExecutionStatus.FAILED
            task.result = {"error": str(exc), "workflow": "Business_Orchestrator"}
            db.commit()
            return

        if result.get("success") is False:
            failure_message = result.get("message") or "The orchestrator reported a workflow failure."
            execution.status = ExecutionStatus.FAILED
            execution.error = failure_message
            execution.output = result
            execution.execution_time = round(time.time() - started, 2)
            execution.completed_at = datetime.now(timezone.utc)
            task.status = ExecutionStatus.FAILED
            task.result = result
            task.completed_at = datetime.now(timezone.utc)
            db.commit()
            return

        execution.status = "COMPLETED"
        execution.output = result
        execution.execution_time = result.get("execution_time") or round(time.time() - started, 2)
        execution.completed_at = datetime.now(timezone.utc)

        task.agent_slug = result.get("agent")
        task.confidence = result.get("confidence")
        task.execution_time = execution.execution_time
        task.result = result
        task.status = (
            ExecutionStatus.AWAITING_APPROVAL if result.get("requires_approval")
            else ExecutionStatus.COMPLETED
        )

        db.commit()
    finally:
        db.close()


@router.get("")
async def list_tasks(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Task)
    if status:
        q = q.filter(Task.status == status)
    tasks = q.order_by(Task.created_at.desc()).limit(200).all()
    return {
        "tasks": [
            {
                "id": str(t.id), "task_number": t.task_number, "title": t.title,
                "status": t.status, "agent_slug": t.agent_slug, "confidence": t.confidence,
                "created_at": t.created_at,
            }
            for t in tasks
        ]
    }


@router.get("/{task_id}")
async def get_task(task_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    executions = db.query(AgentExecution).filter(AgentExecution.task_id == task.id).order_by(AgentExecution.started_at).all()
    return {
        "id": str(task.id), "task_number": task.task_number, "title": task.title,
        "description": task.description, "status": task.status, "agent_slug": task.agent_slug,
        "confidence": task.confidence, "execution_time": task.execution_time,
        "result": task.result, "created_at": task.created_at,
        "executions": [
            {
                "id": str(e.id), "workflow_name": e.workflow_name, "status": e.status,
                "execution_time": e.execution_time, "error": e.error,
                "started_at": e.started_at, "completed_at": e.completed_at,
            }
            for e in executions
        ],
    }