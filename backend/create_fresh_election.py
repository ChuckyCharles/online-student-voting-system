"""
Create a fresh election with all positions and candidates.
Run this AFTER logging in as admin and getting a token.
Or use it as reference for API calls.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import requests
import json
from app.database import SessionLocal
from app.models import School, Department, Course

BASE_URL = "http://localhost:8000"

# Get admin credentials - you need to login first
# Uncomment and run this after obtaining token:
"""
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@university.edu",
    "password": "Admin@123"
})
token = login_resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
"""

# Or provide token directly:
TOKEN = "YOUR_ADMIN_TOKEN_HERE"
headers = {"Authorization": f"Bearer {TOKEN}"}

def create_election(title, description=None):
    resp = requests.post(f"{BASE_URL}/admin/elections", 
                         json={"title": title, "description": description},
                         headers=headers)
    resp.raise_for_status()
    return resp.json()["id"]

def create_position(election_id, name, level, school_id=None, department_id=None, course_id=None):
    body = {
        "election_id": election_id,
        "name": name,
        "level": level,
        "school_id": school_id,
        "department_id": department_id,
        "course_id": course_id,
    }
    resp = requests.post(f"{BASE_URL}/admin/positions", json=body, headers=headers)
    resp.raise_for_status()
    return resp.json()["id"]

def create_candidate(election_id, position_id, name, description=None, photo_url=None):
    body = {
        "election_id": election_id,
        "position_id": position_id,
        "name": name,
        "description": description,
        "photo_url": photo_url,
    }
    resp = requests.post(f"{BASE_URL}/admin/candidates", json=body, headers=headers)
    resp.raise_for_status()
    return resp.json()["id"]

def main():
    db = SessionLocal()
    
    # Step 1: Create election
    print("Creating election...")
    election_id = create_election("Student Council Election 2026", "Fresh election with all positions")
    print(f"  Election ID: {election_id}")
    
    # Step 2: Fetch academic structure from DB
    schools = db.query(School).all()
    departments = db.query(Department).all()
    courses = db.query(Course).all()
    
    # Step 3: Create UNIVERSITY positions
    print("\nCreating UNIVERSITY positions...")
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
    pos_ids = {}
    for pname in uni_positions:
        pid = create_position(election_id, pname, "UNIVERSITY")
        pos_ids[pname] = pid
        print(f"  Created: {pname}")
    
    # Step 4: Create SCHOOL positions
    print("\nCreating SCHOOL positions...")
    for school in schools:
        pname = f"{school.name} Representative"
        pid = create_position(election_id, pname, "SCHOOL", school_id=school.id)
        pos_ids[pname] = pid
        print(f"  Created: {pname}")
    
    # Step 5: Create DEPARTMENT positions
    print("\nCreating DEPARTMENT positions...")
    for dept in departments:
        pname = f"{dept.name} Representative"
        pid = create_position(election_id, pname, "DEPARTMENT", 
                              school_id=dept.school_id, 
                              department_id=dept.id)
        pos_ids[pname] = pid
        print(f"  Created: {pname}")
    
    # Step 6: Create CLASS positions
    print("\nCreating CLASS positions...")
    for course in courses:
        pname = f"{course.name} Class Rep"
        pid = create_position(election_id, pname, "CLASS",
                              school_id=course.department.school_id,
                              department_id=course.department_id,
                              course_id=course.id)
        pos_ids[pname] = pid
        print(f"  Created: {pname}")
    
    # Step 7: Add sample candidates for university positions
    print("\nAdding sample candidates...")
    candidates = [
        ("John Maina", "Committed leader", pos_ids.get("President")),
        ("Jane Smith", "Experience in governance", pos_ids.get("Deputy President")),
        ("Bob Johnson", "Transparency advocate", pos_ids.get("Secretary General")),
        ("Alice Brown", "Finance expert", pos_ids.get("Treasurer")),
        ("Mike Wilson", "Sports development", pos_ids.get("Games Captain")),
        ("Sarah Lee", "Event coordination", pos_ids.get("Events and Entertainment Captain")),
        ("Tom Davis", "Accessibility champion", pos_ids.get("PWD Representative 1")),
        ("Emma White", "Inclusivity advocate", pos_ids.get("PWD Representative 2")),
    ]
    for cname, desc, pid in candidates:
        if pid:
            create_candidate(election_id, pid, cname, desc)
            print(f"  Candidate: {cname} for position {pid[:8]}...")
    
    db.close()
    print(f"\n[OK] Election '{election_id}' created successfully!")
    print("\nNext steps:")
    print("1. Use the admin panel to review positions and candidates")
    print("2. When ready, activate the election via:")
    print(f"   PATCH /admin/elections/{election_id}/status {{'status': 'ACTIVE'}}")
    print("3. Or use the frontend admin dashboard")

if __name__ == "__main__":
    main()
