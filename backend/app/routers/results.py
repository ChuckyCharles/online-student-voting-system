from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/results", tags=["results"])


@router.get("/{election_id}")
def get_results(
    election_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    election = db.get(models.Election, election_id)
    if not election:
        raise HTTPException(404, "Election not found")

    if user.role != models.Role.ADMIN.value and election.status != models.ElectionStatus.ENDED:
        raise HTTPException(403, "Results not available yet")

    candidates = (
        db.query(models.Candidate)
        .filter(models.Candidate.election_id == election_id)
        .all()
    )

    grouped: dict = {}
    for c in candidates:
        pos_name = db.get(models.Position, c.position_id).name
        vote_count = db.query(models.Vote).filter(models.Vote.candidate_id == c.id).count()
        if pos_name not in grouped:
            grouped[pos_name] = []
        grouped[pos_name].append({"id": c.id, "name": c.name, "votes": vote_count})

    return {
        "election": {
            "id": election.id,
            "title": election.title,
            "status": election.status,
            "end_time": election.end_time,
        },
        "results": grouped,
    }
