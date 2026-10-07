# backend/app/api/leads.py
import math
from datetime import datetime, timezone
from typing import Literal, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.database import get_db
from app.models.lead import Lead, LeadClassification, LeadStatus
from app.models.user import User
from app.config import get_settings
from app.services.n8n_service import n8n_service
from app.services.demo_service import demo_service
from app.utils.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/leads", tags=["leads"])
settings = get_settings()


# ---------------- schemas ----------------

class CreateLeadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    source: str = "website"
    notes: Optional[str] = None


class TrackVisitRequest(BaseModel):
    event: Literal["PRODUCT_VIEW", "ORDER_CLICK"]
    product_name: Optional[str] = None


# ---------------- helpers ----------------

def _serialize(lead: Lead) -> dict:
    return {
        "id": str(lead.id), "name": lead.name, "email": lead.email, "phone": lead.phone,
        "lead_name": lead.name, "lead_email": lead.email,
        "source": lead.source, "classification": lead.classification, "confidence": lead.confidence,
        "score": lead.score, "status": lead.status,
        "visit_count": lead.visit_count, "order_click_count": lead.order_click_count,
        "browsed_products": lead.browsed_products, "user_intent_notes": lead.user_intent_notes,
        "first_visited_at": lead.first_visited_at, "last_visited_at": lead.last_visited_at,
        "created_at": lead.created_at,
    }


def _build_intent_notes(lead: Lead) -> str:
    days = 1
    if lead.first_visited_at and lead.last_visited_at:
        elapsed_days = (lead.last_visited_at - lead.first_visited_at).total_seconds() / 86400
        days = max(1, math.ceil(elapsed_days))
    notes = f"Visited product page {lead.visit_count} time{'s' if lead.visit_count != 1 else ''} in {days} day{'s' if days != 1 else ''}"
    if lead.order_click_count:
        click_count = {1: "once", 2: "twice"}.get(
            lead.order_click_count, f"{lead.order_click_count} times"
        )
        notes += f", clicked Order {click_count}"
    notes += "."
    return notes


def _workflow_payload(lead: Lead) -> dict:
    return {
        "lead_name": lead.name,
        "lead_email": lead.email,
        "visit_count": lead.visit_count,
        "browsed_products": lead.browsed_products or [],
        "user_intent_notes": lead.user_intent_notes or "",
    }


# ---------------- public: manual lead capture (e.g. a contact form) ----------------

@router.post("")
async def create_lead(body: CreateLeadRequest, db: Session = Depends(get_db)):
    """Public — new inbound lead submitted directly (contact form, newsletter, etc.)."""
    if settings.DEMO_MODE:
        ai_result = await demo_service.classify_lead(body.notes or "", body.source)
    else:
        raw = await n8n_service.trigger_sales(
            task_id="LEAD-" + body.name[:10],
            lead_info={
                "lead_name": body.name, "lead_email": body.email, "phone": body.phone,
                "source": body.source, "notes": body.notes,
            },
        )
        if raw.get("success") is False:
            raise HTTPException(status_code=502, detail="The Sales workflow could not process this lead.")
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


# ---------------- public: passive behavior tracking ----------------

@router.post("/track")
async def track_visit(
    body: TrackVisitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Called for an authenticated shopper's product views / Order-button clicks.
    Upserts a Lead by email and builds the payload shape the Sales Agent expects:
    lead_name, lead_email, visit_count, browsed_products, user_intent_notes."""
    lead = db.query(Lead).filter(Lead.email == current_user.email).first()
    now = datetime.now(timezone.utc)

    if not lead:
        lead = Lead(
            name=current_user.name, email=current_user.email, source="website_tracking",
            classification="UNCLASSIFIED", status=LeadStatus.NEW,
            first_visited_at=now, browsed_products=[],
        )
        db.add(lead)

    lead.name = current_user.name
    lead.last_visited_at = now
    if not lead.first_visited_at:
        lead.first_visited_at = now

    if body.event == "PRODUCT_VIEW":
        lead.visit_count = (lead.visit_count or 0) + 1
        if body.product_name:
            products = list(lead.browsed_products or [])
            if body.product_name not in products:
                products.append(body.product_name)
            lead.browsed_products = products
    elif body.event == "ORDER_CLICK":
        lead.order_click_count = (lead.order_click_count or 0) + 1
    lead.user_intent_notes = _build_intent_notes(lead)
    db.commit()
    db.refresh(lead)

    # Re-classify once the lead has shown enough intent (every 3rd visit)
    if body.event == "ORDER_CLICK" or (lead.visit_count and lead.visit_count % 3 == 0):
        payload = _workflow_payload(lead)
        if settings.DEMO_MODE:
            ai_result = await demo_service.classify_lead(lead.user_intent_notes, "website_tracking")
        else:
            raw = await n8n_service.trigger_sales(task_id=f"LEAD-{lead.id}", lead_info=payload)
            if raw.get("success") is False:
                raise HTTPException(status_code=502, detail="The Sales workflow could not process this lead.")
            ai_result = {"classification": raw.get("classification"), "confidence": raw.get("confidence")}
        lead.classification = ai_result.get("classification") or lead.classification
        lead.confidence = ai_result.get("confidence")
        db.commit()
        db.refresh(lead)

    return {
        "lead_name": lead.name,
        "lead_email": lead.email,
        "visit_count": lead.visit_count,
        "browsed_products": lead.browsed_products,
        "user_intent_notes": lead.user_intent_notes,
        "classification": lead.classification,
    }


# ---------------- admin ----------------

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
    leads: List[Lead] = q.order_by(Lead.created_at.desc()).limit(200).all()
    return [_serialize(l) for l in leads]


@router.get("/{lead_id}/workflow-payload")
async def get_lead_workflow_payload(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return _workflow_payload(lead)


@router.post("/{lead_id}/run")
async def run_lead_workflow(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    payload = _workflow_payload(lead)
    if settings.DEMO_MODE:
        result = await demo_service.classify_lead(lead.user_intent_notes or "", lead.source or "website")
    else:
        result = await n8n_service.trigger_sales(
            task_id=f"LEAD-{lead.id}",
            lead_info=payload,
        )
    if result.get("success") is False:
        raise HTTPException(status_code=502, detail="The Sales workflow could not process this lead.")

    classification_value = result.get("classification")
    if not classification_value:
        raise HTTPException(status_code=502, detail="The Sales workflow did not return a classification.")
    try:
        lead.classification = LeadClassification(str(classification_value).upper())
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="The Sales workflow returned an invalid classification.") from exc
    lead.confidence = result.get("confidence")
    lead.score = result.get("score") or round((lead.confidence or 0) * 100, 1)
    db.commit()
    db.refresh(lead)
    return {"lead": _serialize(lead), "payload": payload, "workflow": result}


@router.patch("/{lead_id}/status")
async def update_lead_status(lead_id: str, status: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = status
    db.commit()
    return {"status": "updated"}