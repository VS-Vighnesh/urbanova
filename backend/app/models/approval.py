# backend/app/models/approval.py
from sqlalchemy import Column, String, Enum, ForeignKey, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class ApprovalType(str, enum.Enum):
    MARKETING_CAMPAIGN = "MARKETING_CAMPAIGN"
    HR_CANDIDATE = "HR_CANDIDATE"
    BUSINESS_ACTION = "BUSINESS_ACTION"
    INVOICE = "INVOICE"


class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    HOLD = "HOLD"


class Approval(Base):
    __tablename__ = "approvals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)
    type = Column(Enum(ApprovalType), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    entity_id = Column(String(100))
    entity_type = Column(String(50))
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    requested_by_agent = Column(String(100))
    reviewed_by = Column(String(255))
    decision = Column(String(50))
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True))