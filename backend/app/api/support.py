# backend/app/api/support.py
import asyncio
import logging
import random
import smtplib
import string
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.database import get_db
from app.models.ticket import Ticket, TicketStatus
from app.config import get_settings
from app.services.n8n_service import n8n_service
from app.services.demo_service import demo_service
from app.services.email_service import EmailConfigurationError, send_support_email
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/support", tags=["support"])
settings = get_settings()
logger = logging.getLogger(__name__)


class SupportSubmitRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1, max_length=5000)
    customer_email: Optional[EmailStr] = None
    subject: Optional[str] = Field(default=None, max_length=200)


def _ticket_number() -> str:
    return "TKT-" + "".join(random.choices(string.digits, k=6))


@router.post("/submit")
async def submit_ticket(body: SupportSubmitRequest, db: Session = Depends(get_db)):
    """Public — no login required. This is the Customer Support Agent's entry point."""
    if settings.DEMO_MODE:
        ai_result = await demo_service.classify_support_request(body.message, body.customer_email)
    else:
        workflow_result = await n8n_service.trigger_customer_support(
            task_id="TKT-" + str(random.randint(100000, 999999)),
            message=body.message,
            customer_email=body.customer_email,
        )
        if workflow_result.get("success") is False:
            raise HTTPException(status_code=502, detail="The customer support workflow could not process this message.")
        ai_result = {
            "category": workflow_result.get("classification", "GENERAL"),
            "priority": "HIGH" if workflow_result.get("classification") == "URGENT" else "MEDIUM",
            "response": workflow_result.get("message", ""),
            "confidence": workflow_result.get("confidence"),
        }

    ticket = Ticket(
        ticket_number=_ticket_number(),
        customer_email=body.customer_email,
        subject=body.subject or body.message[:80],
        message=f"Name: {body.name}\n\n{body.message}",
        category=ai_result.get("category", "GENERAL"),
        priority=ai_result.get("priority", "MEDIUM"),
        ai_response=ai_result.get("response"),
        status=TicketStatus.OPEN,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    try:
        await asyncio.to_thread(
            send_support_email,
            customer_name=body.name,
            customer_email=str(body.customer_email or ""),
            subject=ticket.subject,
            message=body.message,
            ticket_number=ticket.ticket_number,
            ai_response=ticket.ai_response or "",
        )
    except EmailConfigurationError as exc:
        logger.error("Support email not sent for ticket %s: %s", ticket.ticket_number, exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (OSError, smtplib.SMTPException) as exc:
        logger.exception("Unable to send support email for ticket %s", ticket.ticket_number)
        raise HTTPException(
            status_code=502,
            detail="The support ticket was recorded, but the email could not be delivered. Please use the direct email link.",
        ) from exc

    return {
        "ticket_number": ticket.ticket_number,
        "classification": ticket.category,
        "response": ticket.ai_response,
        "email_sent": True,
        "support_email": settings.SUPPORT_EMAIL,
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