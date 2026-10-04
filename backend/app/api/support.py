# backend/app/api/support.py
import random
import string
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.database import get_db
from app.models.ticket import Ticket, TicketStatus
from app.config import get_settings
from app.services.n8n_service import n8n_service
from app.services.demo_service import demo_service
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/support", tags=["support"])
settings = get_settings()


class SupportSubmitRequest(BaseModel):
    message: str
    customer_email: Optional[EmailStr] = None
    subject: Optional[str] = None


def _ticket_number() -> str:
    return "TKT-" + "".join(random.choices(string.digits, k=6))


@router.post("/submit")
async def submit_ticket(body: SupportSubmitRequest, db: Session = Depends(get_db)):
    """Public — no login required. This is the Customer Support Agent's entry point."""
    if settings.DEMO_MODE:
        ai_result = await demo_service.classify_support_request(body.message, body.customer_email)
    else:
        ai_result = await n8n_service.trigger_customer_support(
            task_id="TKT-" + str(random.randint(100000, 999999)),
            message=body.message,
            customer_email=body.customer_email,
        )
        ai_result = {
            "category": ai_result.get("classification", "GENERAL"),
            "priority": "HIGH" if ai_result.get("classification") == "URGENT" else "MEDIUM",
            "response": ai_result.get("message", ""),
            "confidence": ai_result.get("confidence"),
        }

    ticket = Ticket(
        ticket_number=_ticket_number(),
        customer_email=body.customer_email,
        subject=body.subject or body.message[:80],
        message=body.message,
        category=ai_result.get("category", "GENERAL"),
        priority=ai_result.get("priority", "MEDIUM"),
        ai_response=ai_result.get("response"),
        status=TicketStatus.OPEN,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return {
        "ticket_number": ticket.ticket_number,
        "classification": ticket.category,
        "response": ticket.ai_response,
    }


@router.get("")
async def list_tickets(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Ticket)
    if status:
        q = q.filter(Ticket.status == status)
    tickets = q.order_by(Ticket.created_at.desc()).limit(200).all()
    return [
        {
            "id": str(t.id), "ticket_number": t.ticket_number, "customer_email": t.customer_email,
            "subject": t.subject, "category": t.category, "status": t.status,
            "priority": t.priority, "ai_response": t.ai_response, "created_at": t.created_at,
        }
        for t in tickets
    ]


@router.post("/{ticket_id}/resolve")
async def resolve_ticket(ticket_id: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if ticket:
        ticket.status = TicketStatus.RESOLVED
        db.commit()
    return {"status": "resolved"}