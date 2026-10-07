# backend/app/models/lead.py
import uuid
import enum
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base


class LeadClassification(str, enum.Enum):
    READY_TO_BUY = "READY_TO_BUY"
    NEEDS_CALL = "NEEDS_CALL"
    EARLY_INTEREST = "EARLY_INTEREST"
    LOW_PRIORITY = "LOW_PRIORITY"
    PARTNERSHIP = "PARTNERSHIP"
    SPAM = "SPAM"
    UNCLASSIFIED = "UNCLASSIFIED"


class LeadStatus(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    CONVERTED = "CONVERTED"
    LOST = "LOST"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    source = Column(String(100))
    notes = Column(String(1000))

    classification = Column(SAEnum(LeadClassification), default=LeadClassification.UNCLASSIFIED)
    confidence = Column(Float)
    score = Column(Float, default=0)
    status = Column(SAEnum(LeadStatus), default=LeadStatus.NEW)
    last_contacted_at = Column(DateTime(timezone=True))

    # --- visit-tracking fields for the Sales/Leads Agent (these MUST live
    # inside the class body, as columns on Lead — that's the bug in what
    # you pasted: they were floating outside any class) ---
    visit_count = Column(Integer, nullable=False, default=0)
    order_click_count = Column(Integer, nullable=False, default=0)
    browsed_products = Column(JSONB, nullable=False, default=list)
    first_visited_at = Column(DateTime(timezone=True), nullable=True)
    last_visited_at = Column(DateTime(timezone=True), nullable=True)
    user_intent_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())