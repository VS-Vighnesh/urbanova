# backend/app/api/orders.py
import random
import string
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.order import Order, OrderItem, PaymentStatus, FulfillmentStatus
from app.models.customer import Customer, CustomerStatus
from app.models.cart import Cart, CartItem
from app.models.user import User
from app.schemas.order import CheckoutRequest  # now holds shipping_address + customer_name/email only
from app.utils.auth import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/orders", tags=["orders"])


def generate_order_number() -> str:
    suffix = "".join(random.choices(string.digits, k=5))
    return f"UV-{suffix}"


def serialize_order(o: Order, items=None) -> dict:
    address = dict(o.shipping_address or {})
    pricing = address.pop("_pricing", None)
    payment_method = address.pop("_payment_method", None)
    return {
        "id": str(o.id),
        "order_number": o.order_number,
        "total_amount": float(o.total_amount),
        "payment_status": o.payment_status,
        "payment_method": payment_method,
        "fulfillment_status": o.fulfillment_status,
        "shipping_address": address,
        "pricing": pricing,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "items": [
            {"product_name": i.product_name, "quantity": i.quantity, "price": float(i.price)}
            for i in (items if items is not None else o.items)
        ],
    }


def _resolve_cart(db: Session, current_user: Optional[User], session_token: Optional[str]) -> Optional[Cart]:
    if current_user:
        return db.query(Cart).filter(Cart.user_id == current_user.id).first()
    if session_token:
        return db.query(Cart).filter(Cart.session_token == session_token).first()
    return None


def calculate_order_total(subtotal: float, coupon_code: Optional[str] = None) -> dict:
    code = (coupon_code or "").strip().upper()
    if code and code != "URBANOVA10":
        raise HTTPException(status_code=400, detail="That discount code isn’t valid.")
    discount = round(subtotal * 0.10, 2) if code else 0.0
    shipping = 0.0 if subtotal >= 999 else 99.0
    taxable_amount = max(0.0, subtotal - discount)
    tax = round(taxable_amount * 0.05, 2)
    return {
        "subtotal": round(subtotal, 2),
        "discount": discount,
        "coupon_code": code or None,
        "shipping": shipping,
        "tax": tax,
        "total": round(taxable_amount + shipping + tax, 2),
    }


@router.post("/quote")
async def quote_order(
    coupon_code: Optional[str] = None,
    x_cart_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    cart = _resolve_cart(db, current_user, x_cart_session)
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")
    subtotal = sum(float(item.price_snapshot) * item.quantity for item in cart.items)
    return calculate_order_total(subtotal, coupon_code)


@router.post("")
async def create_order(
    body: CheckoutRequest,
    x_cart_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Cart → Checkout → Order. Reads line items from the caller's server-side cart —
    never trusts client-supplied prices. Simulated payment (PRD: no real gateway)."""
    cart = _resolve_cart(db, current_user, x_cart_session)
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty")

    customer_email = current_user.email if current_user else body.customer_email
    customer_name = current_user.name if current_user else body.customer_name
    if not customer_email or not customer_name:
        raise HTTPException(status_code=400, detail="customer_name and customer_email are required for guest checkout")

    if body.payment_method == "SIMULATED_FAILURE":
        raise HTTPException(
            status_code=402,
            detail="The demo card was declined. Your cart is unchanged; try again or choose cash on delivery.",
        )

    subtotal = sum(float(item.price_snapshot) * item.quantity for item in cart.items)
    pricing = calculate_order_total(subtotal, body.coupon_code)

    customer = db.query(Customer).filter(Customer.email == customer_email).first()
    if not customer:
        customer = Customer(
            name=customer_name, email=customer_email, phone=body.shipping_address.phone,
            address=f"{body.shipping_address.line1}, {body.shipping_address.city}",
            status=CustomerStatus.ACTIVE,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    address = body.shipping_address.model_dump()
    address["_pricing"] = pricing
    address["_payment_method"] = body.payment_method
    order = Order(
        order_number=generate_order_number(),
        customer_id=customer.id,
        total_amount=pricing["total"],
        payment_status=PaymentStatus.PENDING if body.payment_method == "COD" else PaymentStatus.PAID,
        fulfillment_status=FulfillmentStatus.CONFIRMED,
        shipping_address=address,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    for item in cart.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else "Unknown product",
            quantity=item.quantity,
            price=item.price_snapshot,
        ))

    from datetime import datetime
    customer.total_orders = (customer.total_orders or 0) + 1
    customer.total_spend = float(customer.total_spend or 0) + pricing["total"]
    customer.last_order_at = datetime.utcnow()

    # Cart → Order → Clear cart
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()

    return {
        "order_id": str(order.id),
        "order_number": order.order_number,
        "status": "confirmed",
        "payment_method": body.payment_method,
        "payment_status": order.payment_status,
        "pricing": pricing,
        "message": "Cash on delivery selected. No payment was taken." if body.payment_method == "COD"
        else "Payment simulated successfully. No real charge was made.",
    }


@router.get("")
async def my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Order history for the logged-in shopper (matched by account email → Customer record)."""
    customer = db.query(Customer).filter(Customer.email == current_user.email).first()
    if not customer:
        return []
    orders = db.query(Order).filter(Order.customer_id == customer.id).order_by(Order.created_at.desc()).all()
    return [serialize_order(o) for o in orders]


@router.get("/track/{order_number}")
async def track_order(order_number: str, db: Session = Depends(get_db)):
    """Public — no login required. Used by the /track-order page for guest checkouts."""
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(order)


@router.get("/{order_id}")
async def get_order(order_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_owner = order.customer and order.customer.email == current_user.email
    if not is_owner and current_user.role not in ("ADMIN", "MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to view this order")

    return serialize_order(order)