import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models import Election, Position, Candidate, Vote, VotingToken, AuditLog
from sqlalchemy import text
import cuid2

db = SessionLocal()

print("=== DATABASE RESET ===")
print()

# Clear all election-related data (preserves academic structure and users)
print("Deleting votes...")
vote_count = db.query(Vote).count()
db.query(Vote).delete()
print(f"  Deleted {vote_count} votes")

print("Deleting voting tokens...")
token_count = db.query(VotingToken).count()
db.query(VotingToken).delete()
print(f"  Deleted {token_count} tokens")

print("Deleting candidates...")
cand_count = db.query(Candidate).count()
db.query(Candidate).delete()
print(f"  Deleted {cand_count} candidates")

print("Deleting positions...")
pos_count = db.query(Position).count()
db.query(Position).delete()
print(f"  Deleted {pos_count} positions")

print("Deleting elections...")
elec_count = db.query(Election).count()
db.query(Election).delete()
print(f"  Deleted {elec_count} elections")

print("Deleting audit logs...")
audit_count = db.query(AuditLog).count()
db.query(AuditLog).delete()
print(f"  Deleted {audit_count} audit logs")

db.commit()
print()
print("All election data cleared.")
print()
print("Remaining data (academic structure preserved):")
from app.models import School, Department, Course, User
print(f"  Schools: {db.query(School).count()}")
print(f"  Departments: {db.query(Department).count()}")
print(f"  Courses: {db.query(Course).count()}")
print(f"  Users: {db.query(User).count()}")
print()
print("Verifying election tables are empty...")
elections = db.query(Election).count()
positions = db.query(Position).count()
candidates = db.query(Candidate).count()
votes = db.query(Vote).count()
tokens = db.query(VotingToken).count()

if elections == 0 and positions == 0 and candidates == 0:
    print("[OK] DATABASE IS CLEAN - Ready for fresh elections")
    print()
    print("Summary:")
    print(f"  Elections: {elections}")
    print(f"  Positions: {positions}")
    print(f"  Candidates: {candidates}")
    print(f"  Votes: {votes}")
    print(f"  Voting Tokens: {tokens}")
else:
    print("[FAIL] Some data remains")
    print(f"  Elections: {elections}, Positions: {positions}, Candidates: {candidates}")

db.close()
