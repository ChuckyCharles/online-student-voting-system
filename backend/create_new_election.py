"""
Script to create fresh election data with academic structure and candidates.
Deletes all previous election-related data but preserves schools, departments, courses, and users.
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
        print("\n" + "="*60)
        print("FRESH ELECTION DATA CREATION")
        print("="*60 + "\n")
        
        # ── STEP 1: Delete all election-related data ─────────────────────────────
        print("STEP 1: Deleting all previous election data...")
        
        # Order matters due to foreign keys - delete in reverse dependency order
        audit_count = db.query(models.AuditLog).count()
        token_count = db.query(models.VotingToken).count()
        vote_count = db.query(models.Vote).count()
        
        db.query(models.AuditLog).delete()
        db.query(models.VotingToken).delete()
        db.query(models.Vote).delete()
        db.query(models.Candidate).delete()
        db.query(models.Position).delete()
        db.query(models.Election).delete()
        
        db.commit()
        print(f"  [OK] Deleted {audit_count} audit logs")
        print(f"  [OK] Deleted {token_count} voting tokens")
        print(f"  [OK] Deleted {vote_count} votes")
        print("  [OK] Deleted all candidates, positions, and elections")
        print()
        
        # ── STEP 2: Verify academic structure exists ────────────────────────────
        print("STEP 2: Checking academic structure (schools, departments, courses)...")
        
        schools = db.query(models.School).all()
        if not schools:
            print("  No schools found. Please run seed.py first or create academic structure manually.")
            print("  Exiting...")
            return
        
        print(f"  Found {len(schools)} schools")
        for s in schools:
            print(f"    - {s.name}")
        print()
        
        # ── STEP 3: Create NEW ELECTION ─────────────────────────────────────────
        print("STEP 3: Creating new election...")
        
        now = datetime.now(timezone.utc)
        start_time = now + timedelta(days=1)  # Start tomorrow
        end_time = start_time + timedelta(days=7)  # 7 days duration
        
        election = models.Election(
            id=cuid2.Cuid().generate(),
            title="Student Council Election 2026",
            description="Annual student council election for all university positions. "
                       "Voting opens on April 29, 2026 and closes on May 6, 2026.",
            status=models.ElectionStatus.PENDING,
            start_time=start_time,
            end_time=end_time,
        )
        db.add(election)
        db.commit()
        db.refresh(election)
        
        print(f"  [OK] Created election: '{election.title}'")
        print(f"    ID: {election.id}")
        print(f"    Status: {election.status}")
        print(f"    Start: {election.start_time}")
        print(f"    End: {election.end_time}")
        print()
        
        # ── STEP 4: Create POSITIONS ─────────────────────────────────────────────
        print("STEP 4: Creating positions...")
        
        positions_created = []
        
        # University-level positions (no scope)
        univ_positions = [
            ("President", "Overall student body leader"),
            ("Vice President", "Deputy to the President"),
        ]
        for name, desc in univ_positions:
            p = models.Position(
                id=cuid2.Cuid().generate(),
                name=name,
                election_id=election.id,
                level=models.PositionLevel.UNIVERSITY,
            )
            db.add(p)
            positions_created.append((p.name, "UNIVERSITY", None))
        
        # School-level positions (one per school)
        for school in schools:
            for title in ["President", "Vice President"]:
                name = f"{school.name} {title}"
                p = models.Position(
                    id=cuid2.Cuid().generate(),
                    name=name,
                    election_id=election.id,
                    level=models.PositionLevel.SCHOOL,
                    school_id=school.id,
                )
                db.add(p)
                positions_created.append((p.name, "SCHOOL", school.name))
        
        # Department-level positions (at least 2 per school)
        dept_positions_count = 0
        for school in schools:
            school_depts = db.query(models.Department).filter(
                models.Department.school_id == school.id
            ).limit(2).all()  # At least 2 per school
            
            for dept in school_depts:
                p = models.Position(
                    id=cuid2.Cuid().generate(),
                    name=f"{dept.name} Representative",
                    election_id=election.id,
                    level=models.PositionLevel.DEPARTMENT,
                    school_id=school.id,
                    department_id=dept.id,
                )
                db.add(p)
                positions_created.append((p.name, "DEPARTMENT", f"{school.name} > {dept.name}"))
                dept_positions_count += 1
        
        # Class-level positions (at least 2 per department)
        class_positions_count = 0
        for school in schools:
            for dept in db.query(models.Department).filter(
                models.Department.school_id == school.id
            ).limit(2).all():
                courses = db.query(models.Course).filter(
                    models.Course.department_id == dept.id
                ).limit(2).all()  # At least 2 per department
                
                for course in courses:
                    p = models.Position(
                        id=cuid2.Cuid().generate(),
                        name=f"{course.name} Class Rep",
                        election_id=election.id,
                        level=models.PositionLevel.CLASS,
                        school_id=school.id,
                        department_id=dept.id,
                        course_id=course.id,
                    )
                    db.add(p)
                    positions_created.append((p.name, "CLASS", f"{school.name} > {dept.name} > {course.name}"))
                    class_positions_count += 1
        
        db.commit()
        
        total_positions = len(univ_positions) + len(schools)*2 + dept_positions_count + class_positions_count
        print(f"  [OK] Created {total_positions} positions")
        print(f"    - University: {len(univ_positions)}")
        print(f"    - School: {len(schools)*2}")
        print(f"    - Department: {dept_positions_count}")
        print(f"    - Class: {class_positions_count}")
        print()
        
        # ── STEP 5: Create CANDIDATES ────────────────────────────────────────────
        print("STEP 5: Creating candidates...")
        
        candidate_names = {
            "President": [
                ("Alex Johnson", "Experienced leader with 3 years in student council"),
                ("Samira Patel", "Focused on mental health and wellness initiatives"),
                ("Marcus Williams", "Tech advocate and sustainability champion"),
            ],
            "Vice President": [
                ("Jordan Lee", "Strong advocate for student rights"),
                ("Priya Sharma", "Passionate about education reform"),
                ("Tyler Brown", "Community builder and event organizer"),
            ],
            "President (Generic)": [  # Will be replaced with school-specific names
                ("Chris Taylor", "Visionary leader for our school"),
                ("Riley Davis", "Proven track record of student advocacy"),
                ("Morgan Evans", "Innovative thinker with fresh ideas"),
            ],
            "Vice President (Generic)": [
                ("Casey Moore", "Dedicated to inclusivity and diversity"),
                ("Skyler Clark", "Results-driven approach to student issues"),
                ("Drew Martin", "Passionate about academic excellence"),
            ],
            "Department Representative": [
                ("Taylor Swift", "Voice for academic improvements"),
                ("Jamie Foxx", "Focused on career readiness"),
                ("Avery Stone", "Strong advocate for student needs"),
            ],
            "Class Representative": [
                ("Reese Witherspoon", "Approachable and responsive to class concerns"),
                ("Patricia Arquette", "Experienced in student government"),
                ("Joseph Gordon", "Committed to making change happen"),
                ("Mila Kunis", "Creative problem solver"),
                ("Chris Hemsworth", "Enthusiastic team player"),
            ],
        }
        
        positions = db.query(models.Position).filter(
            models.Position.election_id == election.id
        ).all()
        
        candidates_created = 0
        
        for pos in positions:
            # Select appropriate candidate names based on position type
            if pos.level == models.PositionLevel.UNIVERSITY:
                candidates_data = candidate_names[pos.name]
            elif pos.level == models.PositionLevel.SCHOOL:
                base_name = "President" if "President" in pos.name else "Vice President"
                candidates_data = candidate_names[f"{base_name} (Generic)"]
            elif pos.level == models.PositionLevel.DEPARTMENT:
                candidates_data = candidate_names["Department Representative"]
            else:  # CLASS
                candidates_data = candidate_names["Class Representative"]
            
            # Create 3-4 candidates per position
            for i, (name, desc) in enumerate(candidates_data):
                # Add variety by appending a number
                display_name = f"{name} {i+1}" if pos.level != models.PositionLevel.UNIVERSITY else name
                
                c = models.Candidate(
                    id=cuid2.Cuid().generate(),
                    name=display_name,
                    description=desc,
                    election_id=election.id,
                    position_id=pos.id,
                    image_url=None,  # No photos by default
                )
                db.add(c)
                candidates_created += 1
        
        db.commit()
        
        print(f"  [OK] Created {candidates_created} candidates")
        print(f"    Average: {candidates_created // len(positions)} per position")
        print()
        
        # ── STEP 6: Summary ──────────────────────────────────────────────────────
        print("="*60)
        print("CREATION COMPLETE")
        print("="*60)
        print(f"\nElection: '{election.title}'")
        print(f"  ID: {election.id}")
        print(f"  Status: {election.status}")
        print(f"  Voting Period: {election.start_time} -> {election.end_time}")
        print(f"\nAcademic Structure:")
        print(f"  Schools: {len(schools)}")
        for school in schools:
            dept_count = db.query(models.Department).filter(
                models.Department.school_id == school.id
            ).count()
            print(f"    - {school.name}: {dept_count} departments")
        
        print(f"\nPositions: {total_positions}")
        print(f"Candidates: {candidates_created}")
        print(f"\nNext steps:")
        print(f"  1. Activate election: PATCH /admin/elections/{election.id}/status")
        print(f"  2. Admin can now manage the election via admin dashboard")
        print(f"  3. Students can vote once election becomes ACTIVE")
        print()
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
