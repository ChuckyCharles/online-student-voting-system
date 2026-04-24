import cuid2
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _audit(db: Session, user_id: str, action: str, ip: str | None = None, details: str | None = None):
    db.add(models.AuditLog(id=cuid2.Cuid().generate(), user_id=user_id, action=action, ip_address=ip, details=details))
    db.commit()


@router.post("/register", response_model=schemas.UserOut, status_code=201)
def register(body: schemas.RegisterIn, request: Request, db: Session = Depends(get_db)):
    try:
        if db.query(models.User).filter(
            (models.User.email == body.email) | (models.User.student_id == body.student_id)
        ).first():
            raise HTTPException(400, "Email or Student ID already registered")

        school = db.query(models.School).filter(models.School.id == body.school_id).first()
        if not school:
            raise HTTPException(400, "Invalid school_id")
        
        department = db.query(models.Department).filter(
            models.Department.id == body.department_id,
            models.Department.school_id == body.school_id
        ).first()
        if not department:
            raise HTTPException(400, "Invalid department_id for selected school")
        
        course = db.query(models.Course).filter(
            models.Course.id == body.course_id,
            models.Course.department_id == body.department_id
        ).first()
        if not course:
            raise HTTPException(400, "Invalid course_id for selected department")

        user = models.User(
            id=cuid2.Cuid().generate(),
            name=body.name,
            student_id=body.student_id,
            email=body.email,
            password=hash_password(body.password),
            school_id=body.school_id,
            department_id=body.department_id,
            course_id=body.course_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        _audit(db, user.id, "REGISTER", request.client.host if request.client else None)
        return user
    except OperationalError:
        db.rollback()
        raise HTTPException(503, "Database connection error. Please try again.")


@router.post("/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, request: Request, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.email == body.email).first()
        if user is None or not verify_password(body.password, user.password):
            raise HTTPException(401, "Invalid email or password")

        ip = request.client.host if request.client else None
        _audit(db, user.id, "LOGIN", ip)
        token = create_token({"sub": user.id, "role": user.role.value, "email": user.email})
        return {"access_token": token, "role": user.role.value, "name": user.name, "school_id": user.school_id, "department_id": user.department_id, "course_id": user.course_id}
    except OperationalError:
        db.rollback()
        raise HTTPException(503, "Database connection error. Please try again.")


@router.get("/schools", response_model=list[schemas.SchoolOut])
def list_schools(db: Session = Depends(get_db)):
    return db.query(models.School).all()


@router.get("/departments", response_model=list[schemas.DepartmentOut])
def list_departments(school_id: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Department)
    if school_id:
        q = q.filter(models.Department.school_id == school_id)
    return q.all()


@router.get("/courses", response_model=list[schemas.CourseOut])
def list_courses(department_id: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Course)
    if department_id:
        q = q.filter(models.Course.department_id == department_id)
    return q.all()
