from datetime import datetime, timedelta
from dataclasses import dataclass
import cuid2
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: str
    role: str
    email: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> CurrentUser:
    # Dev wiring: if Authorization is missing, create/find an anonymous user
    # so vote/token foreign keys still work.
    if credentials is None:
        anon_email = "anon@local"
        user = db.query(models.User).filter(models.User.email == anon_email).first()
        if user is None:
            user = models.User(
                id=cuid2.cuid(),
                name="Anonymous",
                student_id=f"ANON-{cuid2.cuid()[:8]}",
                email=anon_email,
                password=hash_password("dev-pass"),
                role=models.Role.STUDENT,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return CurrentUser(id=user.id, role=user.role.value, email=user.email)

    payload = decode_token(credentials.credentials)
    # Auth token claims are used directly (we avoid DB lookups here).
    return CurrentUser(
        id=payload.get("sub"),
        role=payload.get("role", models.Role.STUDENT.value),
        email=payload.get("email", ""),
    )


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != models.Role.ADMIN.value and not settings.DEV_RELAX_ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    return user
