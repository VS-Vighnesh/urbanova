# backend/app/schemas/cart.py
from pydantic import BaseModel, Field


class AddCartItemRequest(BaseModel):
    product_id: str
    quantity: int = Field(default=1, ge=1)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(ge=0)  # 0 removes the item