import logging
import uuid
from decimal import Decimal
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.services.demo_service import demo_service
from app.services.n8n_service import n8n_service
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/invoices", tags=["invoices"])
settings = get_settings()
logger = logging.getLogger(__name__)


class InvoiceProcessRequest(BaseModel):
    invoice_number: str = Field(min_length=1, max_length=50)
    vendor_name: str = Field(min_length=1, max_length=255)
    vendor_email: Optional[EmailStr] = None
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="INR", min_length=3, max_length=10)
    due_date: Optional[datetime] = None
    description: Optional[str] = Field(default=None, max_length=2000)

    @field_validator("invoice_number", "vendor_name")
    @classmethod
    def require_nonblank_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field cannot be blank.")
        return normalized


def _serialize(invoice: Invoice) -> dict:
    return {
        "id": str(invoice.id),
        "invoice_number": invoice.invoice_number,
        "vendor_name": invoice.vendor_name,
        "vendor_email": invoice.vendor_email,
        "amount": float(invoice.amount),
        "currency": invoice.currency,
        "due_date": invoice.due_date,
        "description": invoice.description,
        "status": invoice.status,
        "ai_processed": invoice.ai_processed,
        "ai_notes": invoice.ai_notes,
        "created_at": invoice.created_at,
    }


@router.get("")
async def list_invoices(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    invoices = (
        db.query(Invoice)
        .order_by(Invoice.created_at.desc())
        .limit(200)
        .all()
    )
    return [_serialize(invoice) for invoice in invoices]


@router.post("/process")
async def process_invoice(
    body: InvoiceProcessRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    if db.query(Invoice).filter(Invoice.invoice_number == body.invoice_number.strip()).first():
        raise HTTPException(status_code=409, detail="That invoice number has already been submitted.")

    invoice = Invoice(
        invoice_number=body.invoice_number.strip(),
        vendor_name=body.vendor_name.strip(),
        vendor_email=str(body.vendor_email) if body.vendor_email else None,
        amount=body.amount,
        currency=body.currency.upper(),
        due_date=body.due_date,
        description=body.description,
        status=InvoiceStatus.PROCESSING,
        ai_processed="false",
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    task_id = f"INV-{uuid.uuid4().hex[:10].upper()}"
    invoice_payload = {
        "invoice_number": invoice.invoice_number,
        "vendor_name": invoice.vendor_name,
        "vendor_email": invoice.vendor_email,
        "amount": str(invoice.amount),
        "currency": invoice.currency,
        "due_date": body.due_date.isoformat() if body.due_date else None,
        "description": invoice.description,
    }
    try:
        result = (
            await demo_service.invoice_response(invoice_payload, task_id)
            if settings.DEMO_MODE
            else await n8n_service.trigger_invoice(task_id, invoice_payload)
        )
    except (httpx.HTTPError, ValueError) as exc:
        logger.exception("Invoice workflow failed for invoice %s", invoice.id)
        invoice.status = InvoiceStatus.FLAGGED
        invoice.ai_notes = f"Workflow failed: {exc}"
        db.commit()
        raise HTTPException(status_code=502, detail="The invoice workflow could not process this invoice.") from exc

    if result.get("success") is False:
        invoice.status = InvoiceStatus.FLAGGED
        invoice.ai_notes = result.get("message") or "The invoice workflow reported a failure."
        db.commit()
        raise HTTPException(status_code=502, detail="The invoice workflow could not process this invoice.")

    invoice.status = InvoiceStatus.VALIDATED
    invoice.ai_processed = "true"
    invoice.ai_notes = result.get("message") or ""
    db.commit()
    db.refresh(invoice)
    return {"invoice": _serialize(invoice), "workflow": result}