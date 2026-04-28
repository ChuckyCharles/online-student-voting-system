"""Add all positions and candidates to the fresh election"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import School, Department, Course
from urllib.request import Request, urlopen
import json

BASE = "http://localhost:8000"

# Get admin token
login_data = json.dumps({
    "email": "admin@university.edu",
    "password": "Admin@123"
}).encode()
req = Request(f"{BASE}/auth/login", data=login_data, headers={"Content-Type": "application/json"}, method="POST")
resp = urlopen(req)
token = json.loads(resp.read())["access_token"]
auth_header = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def api_post(path, body):
    data = json.dumps(body).encode()
    req = Request(f"{BASE}{path}", data=data, headers=auth_header, method="POST")
    resp = urlopen(req)
    return json.loads(resp.read())

# Get academic structure from DB
db = SessionLocal()
schools = db.query(School).all()
depts = db.query(Department).all()
courses = db.query(Course).all()
db.close()

# Election ID to use
ELECTION_ID = "acuej65wcu5kzk5p260lu6xm"

print("=== ADDING SCHOOL POSITIONS ===")
for school in schools:
    resp = api_post("/admin/positions", {
        "election_id": ELECTION_ID,
        "name": f"{school.name} Representative",
        "level": "SCHOOL",
        "school_id": school.id
    })
    print(f"  {school.name} Representative: {resp['id'][:8]}...")

print("\n=== ADDING DEPARTMENT POSITIONS ===")
for dept in depts:
    resp = api_post("/admin/positions", {
        "election_id": ELECTION_ID,
        "name": f"{dept.name} Representative",
        "level": "DEPARTMENT",
        "school_id": dept.school_id,
        "department_id": dept.id
    })
    print(f"  {dept.name} Representative: {resp['id'][:8]}...")

print("\n=== ADDING CLASS POSITIONS ===")
for course in courses:
    resp = api_post("/admin/positions", {
        "election_id": ELECTION_ID,
        "name": f"{course.name} Class Rep",
        "level": "CLASS",
        "school_id": course.department.school_id,
        "department_id": course.department_id,
        "course_id": course.id
    })
    print(f"  {course.name} Class Rep: {resp['id'][:8]}...")

print("\n[OK] All positions added successfully!")
print(f"\nUse the admin panel at http://localhost:5173/admin to:")
print(f"  1. Review all positions")
print(f"  2. Add candidates for each position")
print(f"  3. Upload candidate images (optional)")
print(f"  4. Activate election when ready via PATCH /admin/elections/{ELECTION_ID}/status")
