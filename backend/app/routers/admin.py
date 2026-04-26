import cuid2
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app import models, schemas
from app.auth import require_admin

from sqlalchemy import func
router = APIRouter(prefix="/admin", tags=["admin"])


def audit(db: Session, user_id: str, action: str, target: str = None, details: str = None):
    db.add(models.AuditLog(id=cuid2.Cuid().generate(), user_id=user_id, action=action, target=target, details=details))
    db.commit()


def _validate_position_scope(db: Session, body: schemas.PositionCreate):
    if not db.get(models.Election, body.election_id):
        raise HTTPException(400, "Invalid election_id")

    if body.level == models.PositionLevel.UNIVERSITY:
        return

    if body.level == models.PositionLevel.SCHOOL:
        if not body.school_id:
            raise HTTPException(400, "school_id is required for SCHOOL level")
        if not db.get(models.School, body.school_id):
            raise HTTPException(400, "Invalid school_id")
        return

    if body.level == models.PositionLevel.DEPARTMENT:
        if not body.school_id or not body.department_id:
            raise HTTPException(400, "school_id and department_id are required for DEPARTMENT level")
        dept = db.get(models.Department, body.department_id)
        if not dept or dept.school_id != body.school_id:
            raise HTTPException(400, "Invalid department_id for selected school")
        return

    if body.level == models.PositionLevel.CLASS:
        if not body.school_id or not body.department_id or not body.course_id:
            raise HTTPException(400, "school_id, department_id and course_id are required for CLASS level")
        dept = db.get(models.Department, body.department_id)
        course = db.get(models.Course, body.course_id)
        if not dept or dept.school_id != body.school_id:
            raise HTTPException(400, "Invalid department_id for selected school")
        if not course or course.department_id != body.department_id:
            raise HTTPException(400, "Invalid course_id for selected department")
        return


# ── Stats ──────────────────────────────────────────────────────────────────
@router.get("/stats")
def stats(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return {
        "total_students": db.query(models.User).filter(models.User.role == models.Role.STUDENT).count(),
        "total_votes": db.query(models.Vote).count(),
        "elections": db.query(models.Election).order_by(models.Election.created_at.desc()).limit(5).all(),
        "recent_logs": db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(20).all(),
    }


# ── Audit Logs ─────────────────────────────────────────────────────────────
@router.get("/audit-logs", response_model=list[schemas.AuditLogOut])
def audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    return (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ── Elections ──────────────────────────────────────────────────────────────
@router.get("/elections")
def list_elections(db: Session = Depends(get_db), admin=Depends(require_admin)):
    elections = db.query(models.Election).options(
        selectinload(models.Election.positions).selectinload(models.Position.candidates)
    ).order_by(models.Election.created_at.desc()).all()
    
    return [
        schemas.ElectionOut(
            id=e.id,
            title=e.title,
            description=e.description,
            status=e.status,
            start_time=e.start_time,
            end_time=e.end_time,
            created_at=e.created_at,
            positions=[
                schemas.PositionInElection(
                    id=p.id,
                    name=p.name,
                    level=p.level,
                    school_id=p.school_id,
                    department_id=p.department_id,
                    course_id=p.course_id,
                    candidates=[
                        schemas.CandidateInElection(
                            id=c.id,
                            name=c.name,
                            description=c.description,
                            image_url=c.image_url,
                        )
                        for c in p.candidates
                    ],
                )
                for p in e.positions
            ],
        )
        for e in elections
    ]


@router.post("/elections", status_code=201, response_model=schemas.ElectionOut)
def create_election(body: schemas.ElectionCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    e = models.Election(id=cuid2.Cuid().generate(), title=body.title, description=body.description)
    db.add(e)
    db.commit()
    db.refresh(e)
    audit(db, admin.id, "CREATE_ELECTION", e.id, e.title)
    return e


@router.patch("/elections/{election_id}", response_model=schemas.ElectionOut)
def update_election_status(
    election_id: str,
    body: schemas.StatusUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    e = db.get(models.Election, election_id)
    if not e:
        raise HTTPException(404, "Not found")
    e.status = body.status
    if body.status == models.ElectionStatus.ACTIVE:
        e.start_time = datetime.utcnow()
    if body.status == models.ElectionStatus.ENDED:
        e.end_time = datetime.utcnow()
    db.commit()
    db.refresh(e)
    audit(db, admin.id, "UPDATE_ELECTION_STATUS", election_id, body.status)
    return e


@router.delete("/elections/{election_id}")
def delete_election(election_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    e = db.get(models.Election, election_id)
    if not e:
        raise HTTPException(404, "Not found")
    db.delete(e)
    db.commit()
    audit(db, admin.id, "DELETE_ELECTION", election_id)
    return {"message": "Deleted"}


# ── Positions ──────────────────────────────────────────────────────────────
@router.post("/positions", status_code=201, response_model=schemas.PositionOut)
def create_position(body: schemas.PositionCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    _validate_position_scope(db, body)
    p = models.Position(
        id=cuid2.Cuid().generate(),
        name=body.name,
        election_id=body.election_id,
        level=body.level,
        school_id=body.school_id,
        department_id=body.department_id,
        course_id=body.course_id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    audit(db, admin.id, "CREATE_POSITION", p.id, p.name)
    return p


@router.delete("/positions/{position_id}")
def delete_position(position_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    p = db.get(models.Position, position_id)
    if not p:
        raise HTTPException(404, "Not found")
    db.delete(p)
    db.commit()
    audit(db, admin.id, "DELETE_POSITION", position_id)
    return {"message": "Deleted"}


# ── Candidates ─────────────────────────────────────────────────────────────
@router.get("/candidates")
def list_candidates(db: Session = Depends(get_db), admin=Depends(require_admin)):
    candidates = db.query(models.Candidate).options(
        selectinload(models.Candidate.position),
        selectinload(models.Candidate.election),
    ).order_by(models.Candidate.created_at.desc()).all()
    
    return [
        schemas.CandidateOut(
            id=c.id,
            name=c.name,
            description=c.description,
            image_url=c.image_url,
            position_id=c.position_id,
            election_id=c.election_id,
            position=schemas.PositionForCandidate(id=c.position.id, name=c.position.name) if c.position else None,
            election=schemas.ElectionForCandidate(id=c.election.id, title=c.election.title) if c.election else None,
        )
        for c in candidates
    ]


@router.post("/candidates", status_code=201, response_model=schemas.CandidateOut)
def create_candidate(body: schemas.CandidateCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    election = db.get(models.Election, body.election_id)
    if not election:
        raise HTTPException(400, "Invalid election_id")

    position = db.get(models.Position, body.position_id)
    if not position:
        raise HTTPException(400, "Invalid position_id")
    if position.election_id != body.election_id:
        raise HTTPException(400, "Position does not belong to selected election")

    duplicate = db.query(models.Candidate).filter(
        models.Candidate.position_id == body.position_id,
        models.Candidate.name == body.name,
    ).first()
    if duplicate:
        raise HTTPException(409, "Candidate with this name already exists for the position")

    c = models.Candidate(id=cuid2.Cuid().generate(), **body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    audit(db, admin.id, "CREATE_CANDIDATE", c.id, c.name)
    return c


@router.patch("/candidates/{candidate_id}", response_model=schemas.CandidateOut)
def update_candidate(
    candidate_id: str,
    body: schemas.CandidateUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    c = db.get(models.Candidate, candidate_id)
    if not c:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    audit(db, admin.id, "UPDATE_CANDIDATE", candidate_id, c.name)
    return c


@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    c = db.get(models.Candidate, candidate_id)
    if not c:
        raise HTTPException(404, "Not found")
    db.delete(c)
    db.commit()
    audit(db, admin.id, "DELETE_CANDIDATE", candidate_id)
    return {"message": "Deleted"}


# ── Users ──────────────────────────────────────────────────────────────────
@router.get("/users")
def list_users(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(models.User).filter(models.User.role == models.Role.STUDENT).order_by(models.User.created_at.desc()).all()


@router.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    u = db.get(models.User, user_id)
    if not u:
        raise HTTPException(404, "Not found")
    db.delete(u)
    db.commit()
    audit(db, admin.id, "DELETE_USER", user_id)
    return {"message": "Deleted"}


# ── Academic Structure ─────────────────────────────────────────────────────
@router.get("/schools", response_model=list[schemas.SchoolOut])
def list_schools(db: Session = Depends(get_db), admin=Depends(require_admin)):
    return db.query(models.School).all()

@router.get("/departments", response_model=list[schemas.DepartmentOut])
def list_departments(school_id: str | None = None, db: Session = Depends(get_db), admin=Depends(require_admin)):
    q = db.query(models.Department)
    if school_id:
        q = q.filter(models.Department.school_id == school_id)
    return q.all()

@router.get("/courses", response_model=list[schemas.CourseOut])
def list_courses(department_id: str | None = None, db: Session = Depends(get_db), admin=Depends(require_admin)):
    q = db.query(models.Course)
    if department_id:
        q = q.filter(models.Course.department_id == department_id)
    return q.all()

@router.post("/schools", status_code=201, response_model=schemas.SchoolOut)
def create_school(body: schemas.SchoolCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    s = models.School(id=cuid2.Cuid().generate(), name=body.name)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.post("/departments", status_code=201, response_model=schemas.DepartmentOut)
def create_department(body: schemas.DepartmentCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    d = models.Department(id=cuid2.Cuid().generate(), name=body.name, school_id=body.school_id)
    db.add(d)
    db.commit()
    db.refresh(d)
    return d

@router.post("/courses", status_code=201, response_model=schemas.CourseOut)
def create_course(body: schemas.CourseCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    c = models.Course(id=cuid2.Cuid().generate(), name=body.name, department_id=body.department_id)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/schools/{school_id}", response_model=schemas.SchoolOut)
def update_school(
    school_id: str,
    body: schemas.SchoolUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    school = db.get(models.School, school_id)
    if not school:
        raise HTTPException(404, "Not found")
    if body.name is not None:
        school.name = body.name
    db.commit()
    db.refresh(school)
    audit(db, admin.id, "UPDATE_SCHOOL", school_id, school.name)
    return school


@router.delete("/schools/{school_id}")
def delete_school(
    school_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    school = db.get(models.School, school_id)
    if not school:
        raise HTTPException(404, "Not found")
    db.delete(school)
    db.commit()
    audit(db, admin.id, "DELETE_SCHOOL", school_id)
    return {"message": "Deleted"}


@router.put("/departments/{department_id}", response_model=schemas.DepartmentOut)
def update_department(
    department_id: str,
    body: schemas.DepartmentUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    dept = db.get(models.Department, department_id)
    if not dept:
        raise HTTPException(404, "Not found")
    if body.name is not None:
        dept.name = body.name
    if body.school_id is not None:
        if not db.get(models.School, body.school_id):
            raise HTTPException(400, "Invalid school_id")
        dept.school_id = body.school_id
    db.commit()
    db.refresh(dept)
    audit(db, admin.id, "UPDATE_DEPARTMENT", department_id, dept.name)
    return dept


@router.delete("/departments/{department_id}")
def delete_department(
    department_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    dept = db.get(models.Department, department_id)
    if not dept:
        raise HTTPException(404, "Not found")
    db.delete(dept)
    db.commit()
    audit(db, admin.id, "DELETE_DEPARTMENT", department_id)
    return {"message": "Deleted"}


@router.put("/courses/{course_id}", response_model=schemas.CourseOut)
def update_course(
    course_id: str,
    body: schemas.CourseUpdate,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    course = db.get(models.Course, course_id)
    if not course:
        raise HTTPException(404, "Not found")
    if body.name is not None:
        course.name = body.name
    if body.department_id is not None:
        if not db.get(models.Department, body.department_id):
            raise HTTPException(400, "Invalid department_id")
        course.department_id = body.department_id
    db.commit()
    db.refresh(course)
    audit(db, admin.id, "UPDATE_COURSE", course_id, course.name)
    return course


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    course = db.get(models.Course, course_id)
    if not course:
        raise HTTPException(404, "Not found")
    db.delete(course)
    db.commit()
    audit(db, admin.id, "DELETE_COURSE", course_id)
    return {"message": "Deleted"}
