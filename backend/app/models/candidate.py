# backend/app/models/candidate.py
from sqlalchemy import Column, String, Enum, Float, DateTime, func, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class CandidateRecommendation(str, enum.Enum):
    SHORTLIST = "SHORTLIST"
    HOLD = "HOLD"
    REJECT = "REJECT"
    UNSCREENED = "UNSCREENED"


class CandidateStatus(str, enum.Enum):
    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    SHORTLISTED = "SHORTLISTED"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    OFFERED = "OFFERED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    position = Column(String(255))
    skills = Column(JSON)
    experience_years = Column(Float)
    resume_url = Column(String(500))
    ai_recommendation = Column(Enum(CandidateRecommendation), default=CandidateRecommendation.UNSCREENED)
    ai_confidence = Column(Float)
    ai_notes = Column(Text)
    status = Column(Enum(CandidateStatus), default=CandidateStatus.APPLIED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())