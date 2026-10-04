# backend/app/models/audit_log.py
from sqlalchemy import Column, String, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255))
    action = Column(String(255), nullable=False)
    entity_type = Column(String(100))
    entity_id = Column(String(255))
    log_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())