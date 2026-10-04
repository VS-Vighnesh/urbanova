# backend/app/models/campaign.py
from sqlalchemy import Column, String, Enum, DateTime, func, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class CampaignChannel(str, enum.Enum):
    EMAIL = "EMAIL"
    SOCIAL = "SOCIAL"
    MIXED = "MIXED"


class CampaignStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    AI_GENERATED = "AI_GENERATED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    PUBLISHED = "PUBLISHED"
    REJECTED = "REJECTED"


class Campaign(Base):
    __tablename__ = "campaigns"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    objective = Column(String(500))
    audience = Column(String(255))
    channel = Column(Enum(CampaignChannel), default=CampaignChannel.EMAIL)
    tone = Column(String(100))
    offer = Column(String(255))
    instructions = Column(Text)
    generated_content = Column(JSON)
    status = Column(Enum(CampaignStatus), default=CampaignStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())