# backend/app/models/product.py
from sqlalchemy import Column, String, Numeric, Integer, Float, Enum, DateTime, func, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
import enum
from app.database import Base


class ProductStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class Category(Base):
    __tablename__ = "categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Product(Base):
    __tablename__ = "products"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    price = Column(Numeric(10, 2), nullable=False)
    original_price = Column(Numeric(10, 2))
    stock = Column(Integer, default=0)
    rating = Column(Float, default=4.5)
    rating_count = Column(Integer, default=0)
    image_url = Column(String(500))
    status = Column(Enum(ProductStatus), default=ProductStatus.ACTIVE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())