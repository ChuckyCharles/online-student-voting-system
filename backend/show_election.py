"""Display final election state"""
from app.database import SessionLocal
from app import models
db = SessionLocal()
e = db.query(models.Election).first()
print(f'=== ELECTION ===')
print(f'{e.title} [{e.status}]')
print(f'ID: {e.id}')
print(f'\n=== POSITIONS ===')
for p in db.query(models.Position).filter_by(election_id=e.id).order_by(models.Position.level).all():
    level = p.level.value if p.level else 'UNKNOWN'
    cand_count = db.query(models.Candidate).filter_by(position_id=p.id).count()
    print(f'  [{level}] {p.name} -> {cand_count} candidates')
print(f'\nTotal positions: {db.query(models.Position).filter_by(election_id=e.id).count()}')
print(f'Total candidates: {db.query(models.Candidate).filter_by(election_id=e.id).count()}')
print(f'Total votes: {db.query(models.Vote).filter_by(election_id=e.id).count()}')
db.close()
