import logging
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.candidate import (
    Candidate,
    CandidateRecommendation,
    CandidateStatus,
)
from app.services.demo_service import demo_service
from app.services.n8n_service import n8n_service
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/hr", tags=["hr"])
settings = get_settings()
logger = logging.getLogger(__name__)


class CandidateScreenRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    position: str = Field(min_length=1, max_length=255)
    skills: list[str] = Field(default_factory=list, max_length=30)
    experience_years: float = Field(ge=0, le=80)
    resume_text: Optional[str] = Field(default=None, max_length=20000)

    @field_validator("name", "position")
    @classmethod
    def require_nonblank_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("This field cannot be blank.")
        return normalized


def _serialize(candidate: Candidate) -> dict:
    return {
        "id": str(candidate.id),
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "position": candidate.position,
        "skills": candidate.skills or [],
        "experience_years": candidate.experience_years,
        "ai_recommendation": candidate.ai_recommendation,
        "ai_confidence": candidate.ai_confidence,
        "ai_notes": candidate.ai_notes,
        "status": candidate.status,
        "created_at": candidate.created_at,
    }


@router.get("/candidates")
async def list_candidates(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    candidates = (
        db.query(Candidate)
        .order_by(Candidate.created_at.desc())
        .limit(200)
        .all()
    )
    return [_serialize(candidate) for candidate in candidates]


@router.post("/screen")
async def screen_candidate(
    body: CandidateScreenRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    candidate = Candidate(
        name=body.name.strip(),
        email=str(body.email),
        phone=body.phone,
        position=body.position.strip(),
        skills=body.skills,
        experience_years=body.experience_years,
        ai_recommendation=CandidateRecommendation.UNSCREENED,
        status=CandidateStatus.SCREENING,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    task_id = f"HR-{uuid.uuid4().hex[:10].upper()}"
    candidate_payload = {
        "candidate_name": candidate.name,
        "candidate_email": candidate.email,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "position": candidate.position,
        "skills": candidate.skills,
        "experience_years": candidate.experience_years,
        "resume_text": body.resume_text,
    }

    try:
        result = (
            await demo_service.hr_response(candidate_payload, task_id)
            if settings.DEMO_MODE
            else await n8n_service.trigger_hr(task_id, candidate_payload)
        )
    except (httpx.HTTPError, ValueError) as exc:
        logger.exception("HR workflow failed for candidate %s", candidate.id)
        candidate.ai_notes = f"Workflow failed: {exc}"
        db.commit()
        raise HTTPException(status_code=502, detail="The HR workflow could not process this candidate.") from exc

    if result.get("success") is False:
        candidate.ai_notes = result.get("message") or "The HR workflow reported a failure."
        db.commit()
        raise HTTPException(status_code=502, detail="The HR workflow could not process this candidate.")

    recommendation_value = result.get("recommendation") or result.get("classification")
    if not recommendation_value:
        candidate.ai_notes = "The HR workflow did not return a recommendation."
        db.commit()
        raise HTTPException(status_code=502, detail="The HR workflow did not return a candidate recommendation.")

    try:
        recommendation = CandidateRecommendation(
            str(recommendation_value).upper()
        )
    except ValueError as exc:
        candidate.ai_notes = "The HR workflow returned an unsupported recommendation."
        db.commit()
        raise HTTPException(status_code=502, detail="The HR workflow returned an invalid recommendation.") from exc

    candidate.ai_recommendation = recommendation
    candidate.ai_confidence = result.get("confidence")
    candidate.ai_notes = result.get("message") or ""
    candidate.status = {
        CandidateRecommendation.SHORTLIST: CandidateStatus.SHORTLISTED,
        CandidateRecommendation.HOLD: CandidateStatus.SCREENING,
        CandidateRecommendation.REJECT: CandidateStatus.REJECTED,
        CandidateRecommendation.UNSCREENED: CandidateStatus.SCREENING,
    }[recommendation]
    db.commit()
    db.refresh(candidate)
    return {"candidate": _serialize(candidate), "workflow": result}