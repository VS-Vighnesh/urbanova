# backend/app/api/products.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid as _uuid
from app.database import get_db
from app.models.product import Product, Category, ProductStatus
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/products", tags=["products"])


def _is_uuid(v: str) -> bool:
    try:
        _uuid.UUID(v)
        return True
    except ValueError:
        return False


def serialize(p: Product) -> dict:
    return {
        "id": str(p.id), "name": p.name, "slug": p.slug, "description": p.description,
        "price": float(p.price), "original_price": float(p.original_price) if p.original_price else None,
        "rating": p.rating, "rating_count": p.rating_count, "stock": p.stock, "status": p.status,
        "category_id": str(p.category_id) if p.category_id else None, "image_url": p.image_url,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


@router.get("")
async def list_products(category: Optional[str] = None, search: Optional[str] = None,
                         sort: Optional[str] = None, min_price: Optional[float] = None,
                         max_price: Optional[float] = None, db: Session = Depends(get_db)):
    q = db.query(Product).filter(Product.status == ProductStatus.ACTIVE)
    if category == "sale":
        q = q.filter(Product.original_price.isnot(None), Product.original_price > Product.price)
    elif category and category not in ("all", "new-arrivals", "best-sellers"):
        cat = db.query(Category).filter(Category.slug == category).first()
        if cat:
            q = q.filter(Product.category_id == cat.id)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    if min_price is not None:
        q = q.filter(Product.price >= min_price)
    if max_price is not None:
        q = q.filter(Product.price <= max_price)
    if sort == "price_asc":
        q = q.order_by(Product.price.asc())
    elif sort == "price_desc":
        q = q.order_by(Product.price.desc())
    elif sort == "rating":
        q = q.order_by(Product.rating.desc())
    elif sort == "popular" or category == "best-sellers":
        q = q.order_by(Product.rating_count.desc())
    else:
        q = q.order_by(Product.created_at.desc())
    return [serialize(p) for p in q.limit(100).all()]


@router.get("/categories")
async def list_categories(db: Session = Depends(get_db)):
    return [{"id": str(c.id), "name": c.name, "slug": c.slug} for c in db.query(Category).all()]


@router.get("/{id_or_slug}")
async def get_product(id_or_slug: str, db: Session = Depends(get_db)):
    f = Product.id == id_or_slug if _is_uuid(id_or_slug) else Product.slug == id_or_slug
    p = db.query(Product).filter(f).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    data = serialize(p)
    data["related"] = [
        serialize(r) for r in db.query(Product)
        .filter(Product.category_id == p.category_id, Product.id != p.id)
        .limit(4).all()
    ]
    return data


class ProductWriteRequest(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    category_id: Optional[str] = None
    image_url: Optional[str] = None
    stock: int = 0
    status: str = "ACTIVE"


@router.post("")
async def create_product(body: ProductWriteRequest, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    existing = db.query(Product).filter(Product.slug == body.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail="A product with this slug already exists")
    product = Product(**body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return serialize(product)


@router.put("/{id}")
async def update_product(id: str, body: ProductWriteRequest, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in body.model_dump().items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return serialize(product)


@router.delete("/{id}")
async def delete_product(id: str, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"status": "deleted"}