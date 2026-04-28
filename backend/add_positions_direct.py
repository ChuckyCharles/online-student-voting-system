"""Add all school, department, and class positions directly to the database"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import Position, PositionLevel, School, Department, Course
import cuid2

db = SessionLocal()

ELECTION_ID = "acuej65wcu5kzk5p260lu6xm"

# Get academic structure
schools = db.query(School).all()
depts = db.query(Department).all()
courses = db.query(Course).all()

count = 0

# School positions
for school in schools:
    p = Position(
        id=f"pos-sch-{cuid2.Cuid().generate()[:8]}",
        name=f"{school.name} Representative",
        election_id=ELECTION_ID,
        level=PositionLevel.SCHOOL,
        school_id=school.id
    )
    db.add(p)
    count += 1

# Department positions
for dept in depts:
    p = Position(
        id=f"pos-dept-{cuid2.Cuid().generate()[:8]}",
        name=f"{dept.name} Representative",
        election_id=ELECTION_ID,
        level=PositionLevel.DEPARTMENT,
        school_id=dept.school_id,
        department_id=dept.id
    )
    db.add(p)
    count += 1

# Class positions
for course in courses:
    p = Position(
        id=f"pos-class-{cuid2.Cuid().generate()[:8]}",
        name=f"{course.name} Class Rep",
        election_id=ELECTION_ID,
        level=PositionLevel.CLASS,
        school_id=course.department.school_id,
        department_id=course.department_id,
        course_id=course.id
    )
    db.add(p)
    count += 1

db.commit()
print(f"Added {count} positions (school + department + class)")

# Show total
total = db.query(Position).filter_by(election_id=ELECTION_ID).count()
print(f"Total positions in election: {total}")
db.close()
