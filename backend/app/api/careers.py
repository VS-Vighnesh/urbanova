import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate, CandidateRecommendation, CandidateStatus
from app.config import get_settings

router = APIRouter(prefix="/api/careers", tags=["careers"])
settings = get_settings()
logger = logging.getLogger(__name__)


class JobApplicationRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    position: str = Field(min_length=1, max_length=255)
    experience_years: float = Field(ge=0, le=80, default=0)
    skills: Optional[str] = None
    cover_letter: Optional[str] = None
    resume_text: Optional[str] = None


@router.get("/positions")
async def list_positions():
    """Public — list open positions."""
    return [
        {"id": "frontend-developer", "title": "Frontend Developer", "type": "Full-time", "location": "Remote", "description": "Build beautiful shopping experiences with Next.js and React."},
        {"id": "backend-engineer", "title": "Backend Engineer", "type": "Full-time", "location": "Hybrid (Bangalore)", "description": "Design scalable APIs with Python and FastAPI."},
        {"id": "ai-ml-engineer", "title": "AI/ML Engineer", "type": "Full-time", "location": "Remote", "description": "Build intelligent automation workflows with Gemini and n8n."},
        {"id": "ui-ux-designer", "title": "UI/UX Designer", "type": "Full-time", "location": "Remote", "description": "Craft delightful user experiences for our e-commerce platform."},
        {"id": "marketing-manager", "title": "Marketing Manager", "type": "Full-time", "location": "On-site (Mumbai)", "description": "Lead data-driven marketing campaigns."},
        {"id": "customer-support-lead", "title": "Customer Support Lead", "type": "Full-time", "location": "Remote", "description": "Manage customer happiness and AI-powered support."},
    ]


@router.post("/apply")
async def apply_for_job(body: JobApplicationRequest, db: Session = Depends(get_db)):
    """Public — no login required. Candidates apply through the careers page."""
    # Store as a candidate in the database
    skills_list = [s.strip() for s in body.skills.split(",")] if body.skills else []
    
    candidate = Candidate(
        name=body.name.strip(),
        email=str(body.email),
        phone=body.phone,
        position=body.position.strip(),
        skills=skills_list,
        experience_years=body.experience_years,
        ai_recommendation=CandidateRecommendation.UNSCREENED,
        status=CandidateStatus.APPLIED,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    logger.info("New job application from %s for %s", body.name, body.position)

    return {
        "success": True,
        "message": f"Thank you for applying, {body.name.strip()}! We'll review your application and get back to you.",
        "candidate_id": str(candidate.id),
        "support_email": "holahoal3311@gmail.com",
    }
