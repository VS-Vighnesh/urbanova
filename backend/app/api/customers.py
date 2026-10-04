# backend/app/api/customers.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.utils.auth import require_admin

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("")
async def list_customers(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    customers = (
        db.query(Customer)
        .order_by(Customer.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(customer.id),
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone,
            "address": customer.address,
            "total_orders": customer.total_orders,
            "total_spend": float(customer.total_spend or 0),
            "last_order_at": customer.last_order_at,
            "status": customer.status,
            "created_at": customer.created_at,
        }
        for customer in customers
    ]


@router.get("/{customer_id}")
async def get_customer(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )
    return {
        "id": str(customer.id),
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address,
        "total_orders": customer.total_orders,
        "total_spend": float(customer.total_spend or 0),
        "last_order_at": customer.last_order_at,
        "status": customer.status,
        "created_at": customer.created_at,
    }