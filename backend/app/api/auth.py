# backend/app/api/auth.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.database import get_db
from app.models.user import User, UserRole
from app.utils.auth import verify_password, create_access_token, get_current_user, hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name cannot be blank.")
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


@router.post("/login")
async def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "user": {"id": str(user.id), "name": user.name, "email": user.email, "role": user.role}}


@router.post("/register")
async def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=body.name, email=body.email, password_hash=hash_password(body.password), role=UserRole.CUSTOMER)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "user": {"id": str(user.id), "name": user.name, "email": user.email, "role": user.role}}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id), "name": current_user.name, "email": current_user.email, "role": current_user.role}