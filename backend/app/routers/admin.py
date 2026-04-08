import cuid2
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app import models, schemas
from app.auth import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


def audit(db: Session, user_id: str, action: str, target: str = None, details: str = None):
    db.add(models.AuditLog(id=cuid2.Cuid().generate(), user_id=user_id, action=action, target=target, details=details))
    db.commit()


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
    return db.query(models.Election).options(
        selectinload(models.Election.positions).selectinload(models.Position.candidates)
    ).order_by(models.Election.created_at.desc()).all()


@router.post("/elections", status_code=201)
def create_election(body: schemas.ElectionCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    e = models.Election(id=cuid2.Cuid().generate(), title=body.title, description=body.description)
    db.add(e)
    db.commit()
    db.refresh(e)
    audit(db, admin.id, "CREATE_ELECTION", e.id, e.title)
    return e


@router.patch("/elections/{election_id}")
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
@router.post("/positions", status_code=201)
def create_position(body: schemas.PositionCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    p = models.Position(id=cuid2.Cuid().generate(), name=body.name, election_id=body.election_id)
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
    return db.query(models.Candidate).options(
        selectinload(models.Candidate.position),
        selectinload(models.Candidate.election),
    ).order_by(models.Candidate.created_at.desc()).all()


@router.post("/candidates", status_code=201)
def create_candidate(body: schemas.CandidateCreate, db: Session = Depends(get_db), admin=Depends(require_admin)):
    c = models.Candidate(id=cuid2.Cuid().generate(), **body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    audit(db, admin.id, "CREATE_CANDIDATE", c.id, c.name)
    return c


@router.patch("/candidates/{candidate_id}")
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
