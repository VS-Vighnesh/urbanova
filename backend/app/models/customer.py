# backend/app/models/customer.py
from sqlalchemy import Column, String, Integer, Numeric, Enum, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class CustomerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    VIP = "VIP"


class Customer(Base):
    __tablename__ = "customers"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20))
    address = Column(String(500))
    total_orders = Column(Integer, default=0)
    total_spend = Column(Numeric(12, 2), default=0)
    last_order_at = Column(DateTime(timezone=True))
    status = Column(Enum(CustomerStatus), default=CustomerStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())