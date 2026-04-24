import cuid2
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/vote", tags=["vote"])


def _is_position_visible_to_user(position: models.Position, user) -> bool:
    if position.level == models.PositionLevel.UNIVERSITY:
        return True
    if position.level == models.PositionLevel.SCHOOL:
        return bool(user.school_id and user.school_id == position.school_id)
    if position.level == models.PositionLevel.DEPARTMENT:
        return bool(user.department_id and user.department_id == position.department_id)
    if position.level == models.PositionLevel.CLASS:
        return bool(user.course_id and user.course_id == position.course_id)
    return False


@router.post("", status_code=201)
def cast_vote(
    body: schemas.VoteIn,
    request: Request,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    election = db.get(models.Election, body.election_id)
    if not election or election.status != models.ElectionStatus.ACTIVE:
        raise HTTPException(400, "Election is not active")

    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == body.candidate_id,
        models.Candidate.position_id == body.position_id,
        models.Candidate.election_id == body.election_id,
    ).first()
    if not candidate:
        raise HTTPException(400, "Invalid candidate")

    position = db.get(models.Position, body.position_id)
    if not position:
        raise HTTPException(400, "Invalid position")
    if not _is_position_visible_to_user(position, user):
        raise HTTPException(403, "You are not allowed to vote for this position")

    try:
        token = models.VotingToken(id=cuid2.Cuid().generate(), user_id=user.id, position_id=body.position_id)
        vote = models.Vote(
            id=cuid2.Cuid().generate(),
            candidate_id=body.candidate_id,
            election_id=body.election_id,
            position_id=body.position_id,
        )
        db.add(token)
        db.add(vote)
        # Audit log — no candidate_id stored to preserve anonymity
        db.add(models.AuditLog(
            id=cuid2.Cuid().generate(),
            user_id=user.id,
            action="VOTE_CAST",
            target=body.election_id,
            details=f"position:{body.position_id}",
            ip_address=request.client.host if request.client else None,
        ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "You have already voted for this position")

    return {"message": "Vote cast successfully"}
