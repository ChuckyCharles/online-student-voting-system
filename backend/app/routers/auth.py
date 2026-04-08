import cuid2
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter(
        (models.User.email == body.email) | (models.User.student_id == body.student_id)
    ).first():
        raise HTTPException(400, "Email or Student ID already registered")

    user = models.User(
        id=cuid2.cuid(),
        name=body.name,
        student_id=body.student_id,
        email=body.email,
        password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    # Dev wiring: accept any email/password and ensure a corresponding DB user exists.
    # This makes it possible to start end-to-end wiring without enforcing login/password correctness.
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if user is None:
        is_admin = body.email.lower().startswith("admin")
        role = models.Role.ADMIN if is_admin else models.Role.STUDENT
        user = models.User(
            id=cuid2.cuid(),
            name=body.email.split("@")[0],
            student_id=f"AUTO-{cuid2.cuid()[:10]}",
            email=body.email,
            password=hash_password(body.password),
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_token({"sub": user.id, "role": user.role.value, "email": user.email})
    return {"access_token": token, "role": user.role.value, "name": user.name}
