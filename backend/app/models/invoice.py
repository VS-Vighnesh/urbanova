# backend/app/models/invoice.py
from sqlalchemy import Column, String, Enum, Numeric, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class InvoiceStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    VALIDATED = "VALIDATED"
    PAID = "PAID"
    FLAGGED = "FLAGGED"
    REJECTED = "REJECTED"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_number = Column(String(50), unique=True, nullable=False)
    vendor_name = Column(String(255), nullable=False)
    vendor_email = Column(String(255))
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="INR")
    due_date = Column(DateTime(timezone=True))
    description = Column(Text)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.PENDING)
    ai_processed = Column(String(10), default="false")
    ai_notes = Column(Text)
    file_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())