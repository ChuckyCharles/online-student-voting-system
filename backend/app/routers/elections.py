import cuid2
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/elections", tags=["elections"])


@router.get("", response_model=list[dict])
def list_elections(
    db: Session = Depends(get_db),
    _: models.User = Depends(get_current_user),
):
    elections = db.query(models.Election).options(
        selectinload(models.Election.positions).selectinload(models.Position.candidates)
    ).order_by(models.Election.created_at.desc()).all()

    result = []
    for e in elections:
        result.append({
            "id": e.id,
            "title": e.title,
            "status": e.status,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "positions": [
                {
                    "id": p.id,
                    "name": p.name,
                    "candidates": [
                        {"id": c.id, "name": c.name, "description": c.description}
                        for c in p.candidates
                    ],
                }
                for p in e.positions
            ],
        })
    return result


@router.get("/{election_id}/my-votes")
def my_votes(
    election_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    tokens = (
        db.query(models.VotingToken)
        .join(models.Position)
        .filter(
            models.VotingToken.user_id == user.id,
            models.Position.election_id == election_id,
        )
        .all()
    )
    return {"voted_positions": [t.position_id for t in tokens]}
