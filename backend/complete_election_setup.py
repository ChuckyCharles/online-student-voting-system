"""Complete position setup for fresh election"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Position, PositionLevel, School, Department, Course, Candidate
import cuid2

db = SessionLocal()
ELECTION_ID = "acuej65wcu5kzk5p260lu6xm"

# Get existing positions to avoid duplicates
existing_pos = db.query(Position).filter_by(election_id=ELECTION_ID).all()
existing_names = [p.name for p in existing_pos]
print(f"Existing positions: {len(existing_names)}")
for p in existing_names:
    print(f"  - {p}")

# Get academic structure
schools = db.query(School).all()
depts = db.query(Department).all()
courses = db.query(Course).all()

added = 0

# Add missing SCHOOL positions
for school in schools:
    pname = f"{school.name} Representative"
    if pname not in existing_names:
        p = Position(
            id=f"pos-{cuid2.Cuid().generate()[:8]}",
            name=pname,
            election_id=ELECTION_ID,
            level=PositionLevel.SCHOOL,
            school_id=school.id
        )
        db.add(p)
        print(f"Added SCHOOL: {pname}")
        added += 1

# Add DEPARTMENT positions
for dept in depts:
    pname = f"{dept.name} Representative"
    if pname not in existing_names:
        p = Position(
            id=f"pos-{cuid2.Cuid().generate()[:8]}",
            name=pname,
            election_id=ELECTION_ID,
            level=PositionLevel.DEPARTMENT,
            school_id=dept.school_id,
            department_id=dept.id
        )
        db.add(p)
        print(f"Added DEPARTMENT: {pname}")
        added += 1

# Add CLASS positions
for course in courses:
    pname = f"{course.name} Class Rep"
    if pname not in existing_names:
        p = Position(
            id=f"pos-{cuid2.Cuid().generate()[:8]}",
            name=pname,
            election_id=ELECTION_ID,
            level=PositionLevel.CLASS,
            school_id=course.department.school_id,
            department_id=course.department_id,
            course_id=course.id
        )
        db.add(p)
        print(f"Added CLASS: {pname}")
        added += 1

db.commit()
print(f"\nAdded {added} new positions")

# Verify final count
total = db.query(Position).filter_by(election_id=ELECTION_ID).count()
print(f"Total positions now: {total}")

# Add sample candidates for all positions (one each)
print("\n=== Adding sample candidates ===")
positions = db.query(Position).filter_by(election_id=ELECTION_ID).all()
sample_names = ["Alice Johnson", "Bob Smith", "Carol Williams", "David Brown", "Eve Davis",
                "Frank Miller", "Grace Wilson", "Henry Moore", "Ivy Taylor", "Jack Anderson"]
cand_idx = 0
for pos in positions:
    cname = sample_names[cand_idx % len(sample_names)]
    cand_idx += 1
    # Check if candidate already exists
    existing = db.query(Candidate).filter_by(position_id=pos.id, name=cname).first()
    if existing:
        print(f"  Candidate already exists: {cname} for {pos.name}")
        continue
    c = Candidate(
        id=f"cand-{cuid2.Cuid().generate()[:8]}",
        name=cname,
        election_id=ELECTION_ID,
        position_id=pos.id,
        description=f"Sample candidate for {pos.name}"
    )
    db.add(c)
    print(f"  Added candidate: {cname} -> {pos.name}")
db.commit()
print(f"\nTotal candidates now: {db.query(Candidate).filter_by(election_id=ELECTION_ID).count()}")

db.close()
print("\n[OK] Fresh election is ready!")
print(f"Election ID: {ELECTION_ID}")
print("\nTo activate election, call:")
print(f"  PATCH /admin/elections/{ELECTION_ID}/status {{'status':'ACTIVE'}}")
