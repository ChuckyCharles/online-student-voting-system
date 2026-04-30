"""
Setup script for Machakos University Student Leadership Elections 2026
Populates the database with the complete academic structure and election candidates.
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal, Base, engine
from app import models
import cuid2

def main():
    db = SessionLocal()

    try:
        print("\n" + "="*80)
        print("MACHakos UNIVERSITY STUDENT LEADERSHIP ELECTIONS 2026 - SETUP")
        print("="*80 + "\n")

        # ── STEP 1: Clear existing data ─────────────────────────────
        print("STEP 1: Clearing existing election data...")

        db.query(models.AuditLog).delete()
        db.query(models.VotingToken).delete()
        db.query(models.Vote).delete()
        db.query(models.Candidate).delete()
        db.query(models.Position).delete()
        db.query(models.Election).delete()
        db.query(models.Course).delete()
        db.query(models.Department).delete()
        db.query(models.School).delete()

        db.commit()
        print("  [OK] Cleared all data\n")

        # ── STEP 2: Create Schools ─────────────────────────────
        print("STEP 2: Creating schools...")

        schools = {
            "agriculture": models.School(
                id="school-agriculture",
                name="School of Agriculture, Environment & Health Sciences"
            ),
            "business": models.School(
                id="school-business",
                name="School of Business"
            ),
            "engineering": models.School(
                id="school-engineering",
                name="School of Engineering & Technology"
            )
        }

        for school in schools.values():
            db.add(school)

        db.commit()
        print("  [OK] Created schools\n")

        # ── STEP 3: Create Departments and Courses ─────────────────────────────
        print("STEP 3: Creating departments and courses...")

        academic_structure = {
            "school-agriculture": {
                "Agricultural Studies": {
                    "Agribusiness": ["Kelvin Kiprotich", "Lucy Wambui", "Brian Odhiambo"],
                    "Crop Science": ["Mercy Jepkorir", "James Njoroge", "Anne Atieno"],
                    "Agricultural Extension": ["Peter Mutiso", "Faith Achieng", "David Mwangi"]
                },
                "Environmental Studies": {
                    "Environmental Science": ["Alex Onyango", "Mary Nyawira", "George Otieno"],
                    "Climate Change": ["Kelvin Mutua", "Irene Jepchirchir", "Boniface Mwangi"],
                    "Environmental Management": ["Susan Achieng", "Collins Kiptoo", "Esther Nyambura"]
                },
                "Natural Resources": {
                    "Forestry": ["Paul Njoroge", "Grace Chebet", "Brian Mutiso"],
                    "Wildlife Management": ["Simon Otieno", "Kevin Mwangi", "Peter Kariuki"],
                    "Resource Management": ["Esther Nyambura", "David Mutua", "Lucy Wanjiru"]
                },
                "Health Sciences": {
                    "Public Health": ["Brian Mutua", "Peter Onyango", "Faith Achieng"],
                    "Community Health": ["Samuel Kiplangat", "Lucy Nyawira", "Kevin Kariuki"],
                    "Health Records & IT": ["Dennis Kariuki", "Esther Chebet", "Collins Mwangi"]
                }
            },
            "school-business": {
                "Economics": {
                    "Economics": ["Collins Mutua", "Mercy Chebet", "Kevin Njoroge"],
                    "Statistics": ["Esther Nyambura", "James Kiptoo", "Ann Achieng"],
                    "Actuarial Science": ["David Mwangi", "Peter Kariuki", "Lucy Akinyi"]
                },
                "Accounting, Banking & Finance": {
                    "Accounting": ["Dennis Kiprotich", "Faith Wambui", "Kelvin Otieno"],
                    "Banking": ["Boniface Mutua", "Grace Chepkemoi", "Brian Mwangi"],
                    "Procurement": ["Samuel Onyango", "Kevin Kariuki", "Mercy Achieng"]
                },
                "Business Administration": {
                    "HR": ["Collins Mwangi", "Mercy Jepkorir", "George Otieno"],
                    "Marketing": ["Kelvin Kariuki", "Irene Nyawira", "Victor Mutiso"],
                    "Entrepreneurship": ["Ann Wanjiru", "Peter Mwangi", "Lucy Mutiso"]
                },
                "Hospitality & Tourism": {
                    "Hospitality": ["Peter Mwangi", "Dennis Otieno", "Faith Chebet"],
                    "Tourism": ["Samuel Njoroge", "Kevin Onyango", "Ann Wanjiru"],
                    "Catering": ["Collins Mutiso", "David Mwangi", "Mercy Wanjiru"]
                }
            },
            "school-engineering": {
                "Computing & IT (CIT)": {
                    "Computer Science": ["Brian Mwangi", "Faith Wanjiku", "Kevin Otieno"],
                    "Information Technology": ["Dennis Mutua", "Lucy Nyawira", "Collins Kiptoo"],
                    "Software Engineering": ["Esther Achieng", "Samuel Njoroge", "Kelvin Kariuki"],
                    "Cyber Security": ["Peter Kariuki", "Mercy Akinyi", "David Mutua"],
                    "Cloud Computing": ["Kevin Kiplangat", "Ann Chebet", "Brian Mutiso"]
                },
                "Mechanical Engineering": {
                    "Mechanical": ["David Otieno", "Lucy Achieng", "Collins Mwangi"],
                    "Automotive": ["Peter Mutua", "Esther Nyawira", "Samuel Kiptoo"],
                    "Industrial": ["Brian Mwangi", "Faith Chebet", "Kevin Kariuki"]
                },
                "Building & Civil Engineering": {
                    "Civil": ["Ann Chebet", "Brian Otieno", "Kevin Kiptoo"],
                    "Construction": ["Mercy Akinyi", "Collins Mwangi", "Lucy Wambui"],
                    "Quantity Survey": ["Samuel Onyango", "David Mwangi", "Faith Nyambura"]
                },
                "Electrical & Electronics": {
                    "Electrical": ["Brian Kiptoo", "Faith Nyambura", "Peter Kariuki"],
                    "Electronics": ["Samuel Kiplangat", "Esther Cheplangat"]
                }
            }
        }

        departments = {}
        courses = {}

        for school_id, depts in academic_structure.items():
            for dept_name, course_dict in depts.items():
                dept = models.Department(
                    id=cuid2.Cuid().generate(),
                    name=dept_name,
                    school_id=school_id
                )
                db.add(dept)
                db.flush()
                departments[dept_name] = dept.id

                for course_name, candidates in course_dict.items():
                    course = models.Course(
                        id=cuid2.Cuid().generate(),
                        name=course_name,
                        department_id=dept.id
                    )
                    db.add(course)
                    courses[course_name] = {
                        'id': course.id,
                        'candidates': candidates,
                        'dept_id': dept.id,
                        'school_id': school_id
                    }

        db.commit()
        print("  [OK] Created departments and courses\n")

        # ── STEP 4: Create Election ─────────────────────────────
        print("STEP 4: Creating election...")

        now = datetime.now(timezone.utc)
        start_time = now + timedelta(days=1)  # Start tomorrow
        end_time = start_time + timedelta(days=7)  # 7 days duration

        election = models.Election(
            id=cuid2.Cuid().generate(),
            title="Machakos University Student Leadership Elections 2026",
            status=models.ElectionStatus.PENDING,
            start_time=start_time,
            end_time=end_time,
        )
        db.add(election)
        db.commit()
        db.refresh(election)

        print(f"  [OK] Created election: '{election.title}'")
        print(f"    Start: {election.start_time}")
        print(f"    End: {election.end_time}\n")

        # ── STEP 5: Create Positions and Candidates ─────────────────────────────
        print("STEP 5: Creating positions and candidates...")

        # University Level Positions
        university_positions = {
            "President": ["Brian Mwangi", "Kevin Otieno", "Collins Mutiso"],
            "Deputy President": ["Peter Ochieng", "Samuel Njoroge", "David Mutua"],
            "Secretary General": ["Faith Wanjiku", "Esther Nyambura", "Irene Achieng"],
            "Treasurer": ["Dennis Kiptoo", "Kelvin Kariuki", "Boniface Mutua"],
            "PWD Representative 1": ["Mercy Achieng", "Lucy Wambui", "Ann Wanjiru"],
            "PWD Representative 2": ["Samuel Kiplangat", "Peter Kariuki", "Brian Otieno"],
            "Sports & Entertainment": ["Collins Mutiso", "Victor Kiptoo", "Kevin Mutua"],
            "Academic Affairs rep": ["Esther Nyambura", "Faith Chebet", "Brian Mwangi"],
            "Welfare Rep": ["Peter Ochieng", "Mercy Wanjiru", "David Mwangi"]
        }

        for pos_name, candidates in university_positions.items():
            position = models.Position(
                id=cuid2.Cuid().generate(),
                name=pos_name,
                election_id=election.id,
                level=models.PositionLevel.UNIVERSITY
            )
            db.add(position)
            db.flush()

            for candidate_name in candidates:
                candidate = models.Candidate(
                    id=cuid2.Cuid().generate(),
                    name=candidate_name,
                    election_id=election.id,
                    position_id=position.id
                )
                db.add(candidate)

        # School Representatives
        school_reps = {
            "school-agriculture": ("School of Agriculture, Environment & Health Sciences Representative", ["David Mutua", "Ruth Chebet", "John Kamau"]),
            "school-business": ("School of Business Representative", ["Kelvin Mwangi", "Irene Achieng", "Victor Kiptoo"]),
            "school-engineering": ("School of Engineering & Technology Representative", ["Dennis Mwangi", "Brian Otieno", "Kelvin Kiptoo"])
        }

        for school_id, (pos_name, candidates) in school_reps.items():
            position = models.Position(
                id=cuid2.Cuid().generate(),
                name=pos_name,
                election_id=election.id,
                level=models.PositionLevel.SCHOOL,
                school_id=school_id
            )
            db.add(position)
            db.flush()

            for candidate_name in candidates:
                candidate = models.Candidate(
                    id=cuid2.Cuid().generate(),
                    name=candidate_name,
                    election_id=election.id,
                    position_id=position.id
                )
                db.add(candidate)

        # Course Representatives
        for course_name, course_data in courses.items():
            position = models.Position(
                id=cuid2.Cuid().generate(),
                name=f"{course_name} Representative",
                election_id=election.id,
                level=models.PositionLevel.CLASS,
                school_id=course_data['school_id'],
                department_id=course_data['dept_id'],
                course_id=course_data['id']
            )
            db.add(position)
            db.flush()

            for candidate_name in course_data['candidates']:
                candidate = models.Candidate(
                    id=cuid2.Cuid().generate(),
                    name=candidate_name,
                    election_id=election.id,
                    position_id=position.id
                )
                db.add(candidate)

        db.commit()
        print("  [OK] Created all positions and candidates\n")

        # ── STEP 6: Create Admin User ─────────────────────────────
        print("STEP 6: Creating admin user...")

        from app.auth import hash_password

        # Check if admin already exists
        admin = db.query(models.User).filter(
            (models.User.email == "admin@machakosuni.ac.ke") | 
            (models.User.student_id == "ADMIN001")
        ).first()
        if not admin:
            admin = models.User(
                id=cuid2.Cuid().generate(),
                name="Election Administrator",
                student_id="ADMIN001",
                email="admin@machakosuni.ac.ke",
                password=hash_password("admin123"),
                role=models.Role.ADMIN
            )
            db.add(admin)
            db.commit()
            print("  [OK] Created admin user")
        else:
            print("  [OK] Admin user already exists")

        print("    Email: admin@machakosuni.ac.ke")
        print("    Password: admin123\n")

        print("="*80)
        print("SETUP COMPLETE!")
        print("="*80)
        print(f"Election: {election.title}")
        print(f"Start: {election.start_time}")
        print(f"End: {election.end_time}")
        print("\nAdmin Login:")
        print("Email: admin@machakosuni.ac.ke")
        print("Password: admin123")
        print("\nTo start the election, use the admin dashboard.")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()