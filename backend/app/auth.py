from datetime import datetime, timedelta
from dataclasses import dataclass
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import hashlib
import bcrypt
from app.config import settings
from app.database import get_db
from app import models

bearer = HTTPBearer()


@dataclass(frozen=True)
class CurrentUser:
    id: str
    role: str
    email: str
    school_id: str | None = None
    department_id: str | None = None
    course_id: str | None = None


def hash_password(password: str) -> str:
    normalized = hashlib.sha256(password.encode("utf-8")).hexdigest().encode("ascii")
    return bcrypt.hashpw(normalized, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    normalized = hashlib.sha256(plain.encode("utf-8")).hexdigest().encode("ascii")
    try:
        return bcrypt.checkpw(normalized, hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> CurrentUser:
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return CurrentUser(
        id=user.id,
        role=user.role.value if hasattr(user.role, "value") else str(user.role),
        email=user.email,
        school_id=user.school_id,
        department_id=user.department_id,
        course_id=user.course_id,
    )


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != models.Role.ADMIN.value:
        raise HTTPException(status_code=403, detail="Admin only")
    return user
