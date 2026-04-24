import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import cuid2
from app.database import SessionLocal, engine, Base
from app.models import (
    User, Election, Position, Candidate,
    Role, ElectionStatus, PositionLevel,
    School, Department, Course
)
from app.auth import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def generate_id(prefix):
    return f"{prefix}-{cuid2.Cuid().generate()[:8]}"


def seed():
    print("Seeding database...")

    # ---------------------------
    # SCHOOLS
    # ---------------------------
    schools_data = [
        ("school-engineering", "School of Engineering and Technology"),
        ("school-business", "School of Business"),
        ("school-education", "School of Education"),
        ("school-social", "School of Social Sciences"),
        ("school-health", "School of Health Sciences"),
        ("school-agriculture", "School of Agriculture and Environmental Sciences"),
    ]

    schools = {}
    for sid, sname in schools_data:
        school = School(id=sid, name=sname)
        db.add(school)
        schools[sid] = sid

    # ---------------------------
    # DEPARTMENTS
    # ---------------------------
    departments_data = [
        ("school-engineering", [
            ("dept-cs", "Department of Computer Science"),
            ("dept-ee", "Department of Electrical Engineering"),
        ]),
        ("school-business", [
            ("dept-accounting", "Department of Accounting"),
            ("dept-marketing", "Department of Marketing"),
        ]),
        ("school-education", [
            ("dept-arts-edu", "Department of Arts Education"),
            ("dept-science-edu", "Department of Science Education"),
        ]),
    ]

    departments = {}
    for school_key, depts in departments_data:
        for did, dname in depts:
            dept = Department(
                id=did,
                name=dname,
                school_id=school_key
            )
            db.add(dept)
            departments[did] = did

    # ---------------------------
    # COURSES
    # ---------------------------
    courses_data = [
        ("dept-cs", [("BSc Computer Science", "CS101"), ("BSc Software Engineering", "SE102")]),
        ("dept-ee", [("BSc Electrical Engineering", "EE101")]),
        ("dept-accounting", [("BCom Accounting", "ACC101")]),
    ]

    courses = {}
    for dept_id, course_list in courses_data:
        for cname, ccode in course_list:
            cid = generate_id("course")
            course = Course(
                id=cid,
                name=cname,
                code=ccode,   # ✅ matches model
                department_id=dept_id
            )
            db.add(course)
            courses[cname] = cid

    db.flush()

    # ---------------------------
    # ADMIN USER
    # ---------------------------
    admin = User(
        id="admin-001",
        name="Admin",
        student_id="ADMIN001",
        email="admin@university.edu",
        password=hash_password("Admin@123"),
        role=Role.ADMIN
    )
    db.add(admin)

    # ---------------------------
    # ELECTION
    # ---------------------------
    election = Election(
        id="election-2026",
        title="Student Council Election 2026",
        status=ElectionStatus.PENDING
    )
    db.add(election)
    db.flush()

    # ---------------------------
    # UNIVERSITY POSITIONS
    # ---------------------------
    uni_positions = [
        "President",
        "Deputy President",
        "Secretary General",
        "Treasurer",
        "Games Captain",
        "Events and Entertainment Captain",
        "PWD Representative 1",
        "PWD Representative 2"
    ]

    positions = {}

    for pname in uni_positions:
        pid = generate_id("pos")
        pos = Position(
            id=pid,
            name=pname,
            election_id=election.id,
            level=PositionLevel.UNIVERSITY
        )
        db.add(pos)
        positions[pname] = pid

    db.flush()

    # ---------------------------
    # PRESIDENT CANDIDATE
    # ---------------------------
    db.add(Candidate(
        id=generate_id("cand"),
        name="John Maina",
        election_id=election.id,
        position_id=positions["President"],
        description="Committed leader"
    ))

    # ---------------------------
    # SCHOOL POSITIONS
    # ---------------------------
    school_positions = {}

    for sid, sname in schools_data:
        pos_name = f"{sname} Representative"

        pid = generate_id("pos")
        pos = Position(
            id=pid,
            name=pos_name,
            election_id=election.id,
            level=PositionLevel.SCHOOL,
            school_id=sid
        )
        db.add(pos)
        school_positions[sid] = pid

    db.flush()

    # ---------------------------
    # DEPARTMENT POSITIONS (FIXED)
    # ---------------------------
    dept_positions = {}

    for school_key, depts in departments_data:
        for did, dname in depts:

            pos_name = f"{dname} Representative"  # ✅ FIX

            pid = generate_id("pos")
            pos = Position(
                id=pid,
                name=pos_name,
                election_id=election.id,
                level=PositionLevel.DEPARTMENT,
                department_id=did,
                school_id=school_key
            )

            db.add(pos)
            dept_positions[did] = pid

    db.flush()

    # ---------------------------
    # CLASS POSITIONS
    # ---------------------------
    for cname, cid in courses.items():
        pos = Position(
            id=generate_id("pos"),
            name=f"{cname} Class Rep",
            election_id=election.id,
            level=PositionLevel.CLASS,
            course_id=cid
        )
        db.add(pos)

    db.commit()
    print("=== Seed Complete ===")


seed()
db.close()