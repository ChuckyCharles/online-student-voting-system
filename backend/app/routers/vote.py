import cuid2
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/vote", tags=["vote"])


@router.post("", status_code=201)
def cast_vote(
    body: schemas.VoteIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
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

    try:
        token = models.VotingToken(
            id=cuid2.cuid(),
            user_id=user.id,
            position_id=body.position_id,
        )
        vote = models.Vote(
            id=cuid2.cuid(),
            candidate_id=body.candidate_id,
            election_id=body.election_id,
            position_id=body.position_id,
        )
        db.add(token)
        db.add(vote)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "You have already voted for this position")

    return {"message": "Vote cast successfully"}
