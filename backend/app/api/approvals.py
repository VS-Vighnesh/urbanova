# backend/app/api/approvals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.approval import Approval, ApprovalStatus
from app.models.agent import Task, ExecutionStatus
from app.utils.auth import require_admin
from app.models.campaign import Campaign, CampaignStatus
from app.models.candidate import Candidate, CandidateStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.approval import ApprovalType
router = APIRouter(prefix="/api/approvals", tags=["approvals"])


class Decision(BaseModel):
    reason: Optional[str] = None


@router.get("")
async def list_approvals(status: Optional[str] = None, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    q = db.query(Approval)
    if status:
        q = q.filter(Approval.status == status)
    items = q.order_by(Approval.created_at.desc()).all()
    return [{"id": str(a.id), "type": a.type, "title": a.title, "description": a.description,
             "status": a.status, "requested_by_agent": a.requested_by_agent,
             "entity_type": a.entity_type, "entity_id": a.entity_id,
             "created_at": a.created_at.isoformat() if a.created_at else None} for a in items]


# backend/app/api/approvals.py — replace approve/reject/hold
def _apply_decision(db: Session, approval: Approval, decision: str):
    """Pushes an approval decision back onto the entity it was raised for."""
    if approval.entity_type == "campaign":
        campaign = db.query(Campaign).filter(Campaign.id == approval.entity_id).first()
        if campaign:
            campaign.status = CampaignStatus.PUBLISHED if decision == "APPROVED" else CampaignStatus.REJECTED
    elif approval.entity_type == "candidate":
        candidate = db.query(Candidate).filter(Candidate.id == approval.entity_id).first()
        if candidate:
            candidate.status = CandidateStatus.SHORTLISTED if decision == "APPROVED" else CandidateStatus.REJECTED
    elif approval.entity_type == "invoice":
        invoice = db.query(Invoice).filter(Invoice.id == approval.entity_id).first()
        if invoice:
            invoice.status = InvoiceStatus.VALIDATED if decision == "APPROVED" else InvoiceStatus.REJECTED


@router.post("/{approval_id}/approve")
async def approve(approval_id: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = "APPROVED"
    _apply_decision(db, approval, "APPROVED")
    db.commit()
    return {"status": "approved"}


@router.post("/{approval_id}/reject")
async def reject(approval_id: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = "REJECTED"
    _apply_decision(db, approval, "REJECTED")
    db.commit()
    return {"status": "rejected"}


@router.post("/{approval_id}/hold")
async def hold(approval_id: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    approval.status = "ON_HOLD"
    db.commit()
    return {"status": "on_hold"}