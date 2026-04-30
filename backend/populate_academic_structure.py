"""
Populate missing academic structure: departments and courses for all schools.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app import models
import cuid2

# Academic structure definitions
ACADEMIC_STRUCTURE = {
    "School of Engineering and Technology": [
        ("Computer Science", ["BSc Computer Science", "BSc Software Engineering", "BSc Data Science"]),
        ("Electrical Engineering", ["BSc Electrical Engineering", "BSc Electronics", "BSc Telecommunications"]),
    ],
    "School of Business": [
        ("Business Administration", ["BBA", "BBA Marketing", "BBA Finance"]),
        ("Accounting & Finance", ["BSc Accounting", "BSc Finance", "BSc Economics"]),
    ],
    "School of Education": [
        ("Educational Studies", ["BEd Primary", "BEd Secondary", "BEd Special Needs"]),
        ("Library & Information Science", ["BLIS", "BArchives", "BInfoTech Edu"]),
    ],
    "School of Social Sciences": [
        ("Psychology", ["BA Psychology", "BSc Psychology", "BA Counselling"]),
        ("Sociology", ["BA Sociology", "BA Social Work", "BA Anthropology"]),
    ],
    "School of Health Sciences": [
        ("Nursing", ["BNSc Nursing", "BNSc Midwifery", "Dip Nursing"]),
        ("Public Health", ["BSc Epidemiology", "BSc Health Promotion", "BSc Environmental Health"]),
    ],
    "School of Agriculture and Environmental Sciences": [
        ("Agriculture", ["BSc Agriculture", "BSc Agronomy", "BSc Animal Science"]),
        ("Environmental Science", ["BSc Environmental Science", "BSc Climate Science", "BSc Forestry"]),
    ],
}

def main():
    db = SessionLocal()
    try:
        schools = db.query(models.School).all()
        schools_by_name = {s.name: s for s in schools}
        
        print("\nPopulating academic structure...\n")
        
        total_depts = 0
        total_courses = 0
        
        for school_name, depts in ACADEMIC_STRUCTURE.items():
            school = schools_by_name.get(school_name)
            if not school:
                print(f"  [!] School not found: {school_name}")
                continue
            
            school_depts = db.query(models.Department).filter(
                models.Department.school_id == school.id
            ).all()
            existing_dept_names = {d.name for d in school_depts}
            
            for dept_name, course_names in depts:
                # Create department if missing
                if dept_name not in existing_dept_names:
                    dept = models.Department(
                        id=cuid2.Cuid().generate(),
                        name=dept_name,
                        school_id=school.id,
                    )
                    db.add(dept)
                    db.flush()  # get ID
                    total_depts += 1
                    print(f"  Created dept: {dept_name} in {school_name}")
                else:
                    dept = db.query(models.Department).filter(
                        models.Department.school_id == school.id,
                        models.Department.name == dept_name
                    ).first()
                
                # Create courses
                existing_courses = db.query(models.Course).filter(
                    models.Course.department_id == dept.id
                ).all()
                existing_course_names = {c.name for c in existing_courses}
                
                for i, course_name in enumerate(course_names):
                    if course_name not in existing_course_names:
                        # Generate unique code: take first letters + dept code + number
                        dept_code = dept_name[:3].upper().replace(" ", "")
                        # Use simple incremental numbering to avoid collisions
                        code = f"{dept_code}{str(i+1).zfill(2)}"
                        course = models.Course(
                            id=cuid2.Cuid().generate(),
                            name=course_name,
                            department_id=dept.id,
                            code=code,
                        )
                        db.add(course)
                        db.flush()
                        total_courses += 1
                        print(f"    Created course: {course_name} ({code})")
        
        db.commit()
        print(f"\n[OK] Added {total_depts} departments and {total_courses} courses.")
        print("\nFinal structure:")
        for s in db.query(models.School).all():
            dcount = db.query(models.Department).filter(models.Department.school_id == s.id).count()
            print(f"  {s.name}: {dcount} departments")
            for d in db.query(models.Department).filter(models.Department.school_id == s.id).all():
                ccount = db.query(models.Course).filter(models.Course.department_id == d.id).count()
                print(f"    - {d.name}: {ccount} courses")
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
