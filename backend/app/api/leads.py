# backend/app/api/leads.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.lead import Lead, LeadStatus
from app.config import get_settings
from app.services.n8n_service import n8n_service
from app.services.demo_service import demo_service
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/leads", tags=["leads"])
settings = get_settings()


class CreateLeadRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    source: str = "website"
    notes: Optional[str] = None


@router.post("")
async def create_lead(body: CreateLeadRequest, db: Session = Depends(get_db)):
    """Public — new inbound lead. The Sales/Leads Agent classifies it."""
    if settings.DEMO_MODE:
        ai_result = await demo_service.classify_lead(body.notes or "", body.source)
    else:
        raw = await n8n_service.trigger_sales(
            task_id="LEAD-" + body.name[:10],
            lead_info={"name": body.name, "email": body.email, "phone": body.phone, "source": body.source, "notes": body.notes},
        )
        ai_result = {
            "classification": raw.get("classification", "UNCLASSIFIED"),
            "confidence": raw.get("confidence"),
            "score": round((raw.get("confidence") or 0) * 100, 1),
        }

    lead = Lead(
        name=body.name, email=body.email, phone=body.phone, source=body.source, notes=body.notes,
        classification=ai_result.get("classification", "UNCLASSIFIED"),
        confidence=ai_result.get("confidence"),
        score=ai_result.get("score", 0),
        status=LeadStatus.NEW,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return {"id": str(lead.id), "classification": lead.classification, "confidence": lead.confidence}


@router.get("")
async def list_leads(
    classification: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Lead)
    if classification:
        q = q.filter(Lead.classification == classification)
    if status:
        q = q.filter(Lead.status == status)
    leads = q.order_by(Lead.created_at.desc()).limit(200).all()
    return [
        {
            "id": str(l.id), "name": l.name, "email": l.email, "phone": l.phone,
            "source": l.source, "classification": l.classification, "confidence": l.confidence,
            "score": l.score, "status": l.status, "created_at": l.created_at,
        }
        for l in leads
    ]


@router.patch("/{lead_id}/status")
async def update_lead_status(lead_id: str, status: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = status
    db.commit()
    return {"status": "updated"}