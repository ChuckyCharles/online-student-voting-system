from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/results", tags=["results"])


def _has_user_voted_all_positions(db: Session, user_id: str, election_id: str) -> bool:
    """Check if user has voted for all positions in this election."""
    election = db.get(models.Election, election_id)
    if not election:
        return False
    total_positions = len(election.positions)
    if total_positions == 0:
        return True
    voted_count = (
        db.query(models.VotingToken)
        .join(models.Position)
        .filter(
            models.VotingToken.user_id == user_id,
            models.Position.election_id == election_id,
        )
        .count()
    )
    return voted_count >= total_positions


def _get_user_field_level(user: models.User) -> str:
    """Determine the user's field of vote level based on their academic structure."""
    if user.course_id:
        return "CLASS"
    elif user.department_id:
        return "DEPARTMENT"
    elif user.school_id:
        return "SCHOOL"
    else:
        return "UNIVERSITY"


@router.get("/{election_id}")
def get_results(
    election_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    election = db.get(models.Election, election_id)
    if not election:
        raise HTTPException(404, "Election not found")

    is_admin = user.role == models.Role.ADMIN.value
    has_voted_all = _has_user_voted_all_positions(db, user.id, election_id)

    # Access control:
    # - Admins: always allowed
    # - Students: only if election ended OR they've voted in all positions
    if not is_admin and election.status != models.ElectionStatus.ENDED and not has_voted_all:
        raise HTTPException(403, "Results not available yet")

    candidates = (
        db.query(models.Candidate)
        .filter(models.Candidate.election_id == election_id)
        .all()
    )

    grouped: dict = {}
    for c in candidates:
        pos = db.get(models.Position, c.position_id)
        pos_name = pos.name
        vote_count = db.query(models.Vote).filter(models.Vote.candidate_id == c.id).count()
        if pos_name not in grouped:
            grouped[pos_name] = []
        grouped[pos_name].append({
            "id": c.id,
            "name": c.name,
            "votes": vote_count,
            "photo_url": c.image_url,
            "position_level": pos.level.value if pos.level else None,
        })

    return {
        "election": {
            "id": election.id,
            "title": election.title,
            "status": election.status.value,
            "end_time": election.end_time,
        },
        "results": grouped,
        "is_live_preview": election.status != models.ElectionStatus.ENDED and is_admin,
    }
