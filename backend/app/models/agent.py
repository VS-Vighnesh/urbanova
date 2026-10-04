# backend/app/models/agent.py
from sqlalchemy import Column, String, Enum, DateTime, func, Text, Float, Integer, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class AgentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ERROR = "ERROR"


class ExecutionStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    CANCELLED = "CANCELLED"


class Agent(Base):
    __tablename__ = "agents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    status = Column(Enum(AgentStatus), default=AgentStatus.ACTIVE)
    workflow_name = Column(String(255))
    webhook_key = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Task(Base):
    __tablename__ = "tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_number = Column(String(20), unique=True, nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    input_data = Column(JSON)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    agent_slug = Column(String(100))
    priority = Column(String(20), default="MEDIUM")
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.QUEUED)
    result = Column(JSON)
    confidence = Column(Float)
    created_by = Column(String(255))
    requires_approval = Column(String(10), default="false")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    execution_time = Column(Float)


class AgentExecution(Base):
    __tablename__ = "agent_executions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    workflow_name = Column(String(255))
    status = Column(Enum(ExecutionStatus), default=ExecutionStatus.QUEUED)
    input = Column(JSON)
    output = Column(JSON)
    error = Column(Text)
    execution_time = Column(Float)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))