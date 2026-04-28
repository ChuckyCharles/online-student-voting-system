"""Clean up duplicate elections and positions"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Election, Position, Candidate, VotingToken, Vote, AuditLog
from sqlalchemy import text

db = SessionLocal()

# Keep only the latest election (acuej65wcu5kzk5p260lu6xm)
KEEP_ID = "acuej65wcu5kzk5p260lu6xm"

# Count before
total_elec = db.query(Election).count()
total_pos = db.query(Position).count()
total_cand = db.query(Candidate).count()

# Delete elections other than the one we want to keep
for e in db.query(Election).filter(Election.id != KEEP_ID).all():
    db.delete(e)
db.commit()

print(f"Deleted {total_elec - 1} extra elections")
print(f"Remaining elections: {db.query(Election).count()}")

# Delete positions not belonging to kept election
extra_pos = db.query(Position).filter(Position.election_id != KEEP_ID).count()
db.query(Position).filter(Position.election_id != KEEP_ID).delete()
db.commit()
print(f"Deleted {extra_pos} extra positions")

# Delete candidates not belonging to kept election
extra_cand = db.query(Candidate).filter(Candidate.election_id != KEEP_ID).count()
db.query(Candidate).filter(Candidate.election_id != KEEP_ID).delete()
db.commit()
print(f"Deleted {extra_cand} extra candidates")

# Clean any stray votes/tokens/audit logs
print(f"Cleared votes: {db.query(Vote).delete()}")
print(f"Cleared tokens: {db.query(VotingToken).delete()}")
print(f"Cleared audit logs: {db.query(AuditLog).delete()}")
db.commit()

db.close()
print("\n[OK] Database cleaned. Ready to add positions and candidates to election:", KEEP_ID)
