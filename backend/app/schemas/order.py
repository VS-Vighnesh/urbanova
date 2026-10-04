# backend/app/schemas/order.py
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    line1: str
    city: str
    state: str
    pincode: str


class CheckoutRequest(BaseModel):
    shipping_address: ShippingAddress
    customer_email: Optional[EmailStr] = None   # required only for guest checkout
    customer_name: Optional[str] = None          # required only for guest checkout
    payment_method: Literal["SIMULATED_CARD", "SIMULATED_FAILURE", "COD"] = "SIMULATED_CARD"
    coupon_code: Optional[str] = Field(default=None, max_length=40)