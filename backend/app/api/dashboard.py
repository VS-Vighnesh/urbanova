# backend/app/api/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.database import get_db
from app.models.agent import Task, ExecutionStatus
from app.models.customer import Customer
from app.models.order import Order, PaymentStatus
from app.models.ticket import Ticket, TicketStatus
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(db: Session = Depends(get_db), current_user=Depends(require_admin)):
    revenue = db.query(func.sum(Order.total_amount)).filter(Order.payment_status == PaymentStatus.PAID).scalar() or 0
    orders = db.query(func.count(Order.id)).scalar()
    customers = db.query(func.count(Customer.id)).scalar()
    open_support = db.query(func.count(Ticket.id)).filter(Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])).scalar()
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    tasks_today = db.query(func.count(Task.id)).filter(Task.created_at >= today).scalar()
    completed = db.query(func.count(Task.id)).filter(Task.created_at >= today, Task.status == ExecutionStatus.COMPLETED).scalar()
    awaiting = db.query(func.count(Task.id)).filter(Task.status == ExecutionStatus.AWAITING_APPROVAL).scalar()
    failed = db.query(func.count(Task.id)).filter(Task.created_at >= today, Task.status == ExecutionStatus.FAILED).scalar()
    return {
        "revenue": float(revenue), "orders": orders, "customers": customers,
        "open_support": open_support, "ai_tasks_today": tasks_today,
        "completed_today": completed, "awaiting_approval": awaiting, "failed_today": failed,
        "automation_rate": round((completed / max(tasks_today, 1)) * 100, 1),
    }