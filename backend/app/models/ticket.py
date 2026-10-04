# backend/app/models/ticket.py
from sqlalchemy import Column, String, Enum, ForeignKey, DateTime, func, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class TicketCategory(str, enum.Enum):
    URGENT = "URGENT"
    PAYMENT = "PAYMENT"
    PRODUCT_HELP = "PRODUCT_HELP"
    FEATURE_REQUEST = "FEATURE_REQUEST"
    REFUND = "REFUND"
    SPAM = "SPAM"
    GENERAL = "GENERAL"


class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_CUSTOMER = "AWAITING_CUSTOMER"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(20), unique=True, nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    customer_email = Column(String(255))
    subject = Column(String(500), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(Enum(TicketCategory), default=TicketCategory.GENERAL)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM)
    ai_response = Column(Text)
    resolution = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())