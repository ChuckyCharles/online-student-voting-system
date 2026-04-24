from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from .database import get_db
from .models import User

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# Pydantic Schemas
class RegisterRequest(BaseModel):
    name: str
    email: str
    student_id: str
    password: str
    school_id: str | None = None
    department_id: str | None = None
    course_id: str | None = None

class LoginRequest(BaseModel):
    email: str
    password: str

router = APIRouter()

# REGISTER
@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(data.password)
    new_user = User(
        id=f"user-{data.student_id}",
        name=data.name,
        email=data.email,
        student_id=data.student_id,
        password=hashed_pw,
        school_id=data.school_id,
        department_id=data.department_id,
        course_id=data.course_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

# LOGIN
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Return user info (or JWT if you implement token)
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }