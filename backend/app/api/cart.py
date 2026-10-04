# backend/app/api/cart.py
import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import AddCartItemRequest, UpdateCartItemRequest
from app.utils.auth import get_current_user_optional

router = APIRouter(prefix="/api/cart", tags=["cart"])


def get_or_create_cart(
    db: Session,
    current_user: Optional[User],
    session_token: Optional[str],
    response: Response,
) -> Cart:
    """Resolves the caller's cart: by user_id if logged in, else by X-Cart-Session header.
    If a guest has no session token yet, mints one and echoes it back via response header
    so the frontend can persist it for subsequent requests."""
    if current_user:
        cart = db.query(Cart).filter(Cart.user_id == current_user.id).first()
        if not cart:
            cart = Cart(user_id=current_user.id)
            db.add(cart)
            db.commit()
            db.refresh(cart)
        return cart

    if session_token:
        cart = db.query(Cart).filter(Cart.session_token == session_token).first()
        if cart:
            return cart

    new_token = session_token or str(uuid.uuid4())
    cart = Cart(session_token=new_token)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    response.headers["X-Cart-Session"] = new_token
    return cart


def serialize_cart(cart: Cart) -> dict:
    items = []
    subtotal = 0.0
    for item in cart.items:
        product = item.product
        line_total = float(item.price_snapshot) * item.quantity
        subtotal += line_total
        items.append({
            "id": str(item.id),
            "product_id": str(item.product_id),
            "product_name": product.name if product else "Unknown product",
            "product_image": product.image_url if product else None,
            "price": float(item.price_snapshot),
            "current_price": float(product.price) if product else None,
            "quantity": item.quantity,
            "line_total": line_total,
            "in_stock": (product.stock > 0) if product else False,
        })
    return {
        "id": str(cart.id),
        "items": items,
        "item_count": sum(i["quantity"] for i in items),
        "subtotal": round(subtotal, 2),
    }


@router.get("")
async def get_cart(
    response: Response,
    x_cart_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    cart = get_or_create_cart(db, current_user, x_cart_session, response)
    return serialize_cart(cart)


@router.post("/items")
async def add_item(
    body: AddCartItemRequest,
    response: Response,
    x_cart_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    product = db.query(Product).filter(Product.id == body.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < body.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock available")

    cart = get_or_create_cart(db, current_user, x_cart_session, response)

    existing = db.query(CartItem).filter(CartItem.cart_id == cart.id, CartItem.product_id == product.id).first()
    if existing:
        existing.quantity += body.quantity
        existing.price_snapshot = product.price  # refresh to current price
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=body.quantity, price_snapshot=product.price))

    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.put("/items/{item_id}")
async def update_item(
    item_id: str,
    body: UpdateCartItemRequest,
    response: Response,
    x_cart_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    cart = get_or_create_cart(db, current_user, x_cart_session, response)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if body.quantity == 0:
        db.delete(item)
    else:
        item.quantity = body.quantity

    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.delete("/items/{item_id}")
async def remove_item(
    item_id: str,
    response: Response,
    x_cart_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    cart = get_or_create_cart(db, current_user, x_cart_session, response)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if item:
        db.delete(item)
        db.commit()
    db.refresh(cart)
    return serialize_cart(cart)


@router.delete("")
async def clear_cart(
    response: Response,
    x_cart_session: Optional[str] = Header(default=None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    cart = get_or_create_cart(db, current_user, x_cart_session, response)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(cart)
    return serialize_cart(cart)