"""Seed the database with test data."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import cuid2
from app.database import SessionLocal, engine, Base
from app.models import User, Election, Position, Candidate, Role, ElectionStatus
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    if db.query(User).filter(User.email == "admin@university.edu").first():
        print("Already seeded.")
        return

    admin = User(id=cuid2.Cuid().generate(), name="System Admin", student_id="ADMIN001",
                 email="admin@university.edu", password=hash_password("Admin@123"), role=Role.ADMIN)
    students = [
        User(id=cuid2.Cuid().generate(), name=n, student_id=f"STU00{i+1}",
             email=f"student{i+1}@university.edu", password=hash_password("Student@123"))
        for i, n in enumerate(["Alice Johnson", "Bob Smith", "Carol White", "David Brown"])
    ]
    db.add_all([admin, *students])

    election = Election(id="election-2026", title="Student Council Election 2026", status=ElectionStatus.PENDING)
    db.add(election)
    db.flush()

    pres = Position(id=cuid2.Cuid().generate(), name="President", election_id=election.id)
    vp   = Position(id=cuid2.Cuid().generate(), name="Vice President", election_id=election.id)
    sec  = Position(id=cuid2.Cuid().generate(), name="Secretary", election_id=election.id)
    db.add_all([pres, vp, sec])
    db.flush()

    candidates = [
        Candidate(id=cuid2.Cuid().generate(), name="Emma Davis",   description="Committed to student welfare",          position_id=pres.id, election_id=election.id),
        Candidate(id=cuid2.Cuid().generate(), name="Frank Miller",  description="Innovation and progress",               position_id=pres.id, election_id=election.id),
        Candidate(id=cuid2.Cuid().generate(), name="Grace Lee",     description="Bridging students and faculty",         position_id=vp.id,   election_id=election.id),
        Candidate(id=cuid2.Cuid().generate(), name="Henry Wilson",  description="Transparency and accountability",       position_id=vp.id,   election_id=election.id),
        Candidate(id=cuid2.Cuid().generate(), name="Isla Moore",    description="Efficient record-keeping",              position_id=sec.id,  election_id=election.id),
        Candidate(id=cuid2.Cuid().generate(), name="Jack Taylor",   description="Digital transformation",                position_id=sec.id,  election_id=election.id),
    ]
    db.add_all(candidates)
    db.commit()
    print("✅ Seed complete")
    print("   Admin:   admin@university.edu / Admin@123")
    print("   Student: student1@university.edu / Student@123")

seed()
db.close()
