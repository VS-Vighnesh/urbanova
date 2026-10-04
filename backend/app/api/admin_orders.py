# backend/app/api/admin_orders.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.order import Order, FulfillmentStatus
from app.utils.auth import require_admin
from app.api.orders import serialize_order

router = APIRouter(prefix="/api/admin/orders", tags=["admin-orders"])


class UpdateOrderStatusRequest(BaseModel):
    fulfillment_status: str


@router.get("")
async def list_orders(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 25,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    q = db.query(Order)
    if status:
        q = q.filter(Order.fulfillment_status == status)
    total = q.count()
    orders = q.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return {"total": total, "page": page, "orders": [serialize_order(o) for o in orders]}


@router.put("/{order_id}")
async def update_order_status(
    order_id: str,
    body: UpdateOrderStatusRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if body.fulfillment_status not in FulfillmentStatus.__members__:
        raise HTTPException(status_code=400, detail="Invalid fulfillment status")
    order.fulfillment_status = body.fulfillment_status
    db.commit()
    return serialize_order(order)