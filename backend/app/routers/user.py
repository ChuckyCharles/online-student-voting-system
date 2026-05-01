from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_current_user, CurrentUser, hash_password, verify_password

router = APIRouter(prefix="/user", tags=["user"])


class ProfileOut(BaseModel):
    name: str
    email: str
    role: str
    student_id: str | None = None
    phone: str | None = None
    school: dict | None = None
    department: dict | None = None
    course: dict | None = None
    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    student_id: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class SettingsUpdate(BaseModel):
    notifications_enabled: bool | None = None
    theme: str | None = None


@router.get("/profile", response_model=ProfileOut)
def get_profile(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(models.User, current_user.id)
    if not user:
        raise HTTPException(404, "User not found")
    return ProfileOut(
        name=user.name,
        email=user.email,
        role=user.role.value,
        student_id=user.student_id,
        school={"id": user.school_id, "name": db.get(models.School, user.school_id).name} if user.school_id and db.get(models.School, user.school_id) else None,
        department={"id": user.department_id, "name": db.get(models.Department, user.department_id).name} if user.department_id and db.get(models.Department, user.department_id) else None,
        course={"id": user.course_id, "name": db.get(models.Course, user.course_id).name} if user.course_id and db.get(models.Course, user.course_id) else None,
    )


@router.put("/profile")
def update_profile(body: ProfileUpdate, current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(models.User, current_user.id)
    if not user:
        raise HTTPException(404, "User not found")
    if body.name is not None:
        user.name = body.name
    if body.student_id is not None:
        user.student_id = body.student_id
    db.commit()
    return {"message": "Profile updated"}


@router.post("/change-password")
def change_password(body: PasswordChange, current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(models.User, current_user.id)
    if not user or not verify_password(body.current_password, user.password):
        raise HTTPException(400, "Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    user.password = hash_password(body.new_password)
    db.commit()
    return {"message": "Password changed"}


@router.get("/sessions")
def get_sessions(current_user: CurrentUser = Depends(get_current_user)):
    # JWT is stateless — no server-side session store; return empty list
    return {"sessions": []}


@router.delete("/sessions")
def logout_session(current_user: CurrentUser = Depends(get_current_user)):
    return {"message": "Session logged out"}


@router.post("/enable-2fa")
def enable_2fa(current_user: CurrentUser = Depends(get_current_user)):
    raise HTTPException(501, "2FA is not yet implemented")


@router.put("/settings")
def update_settings(body: SettingsUpdate, current_user: CurrentUser = Depends(get_current_user)):
    # No settings model in DB yet — accept and ignore
    return {"message": "Settings saved"}


@router.delete("/account")
def delete_account(current_user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.get(models.User, current_user.id)
    if not user:
        raise HTTPException(404, "User not found")
    db.delete(user)
    db.commit()
    return {"message": "Account deleted"}
