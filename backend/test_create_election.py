"""Quick test to create a simple election"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app.models import School, Department, Course
from urllib.request import Request, urlopen
import json

BASE = "http://localhost:8000"

def post(path, body, token):
    data = json.dumps(body).encode()
    req = Request(f"{BASE}{path}", data=data, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }, method="POST")
    resp = urlopen(req)
    return json.loads(resp.read())

# 1. Login as admin
login_data = json.dumps({
    "email": "admin@university.edu",
    "password": "Admin@123"
}).encode()
req = Request(f"{BASE}/auth/login", data=login_data, headers={"Content-Type": "application/json"}, method="POST")
resp = urlopen(req)
token = json.loads(resp.read())["access_token"]
print(f"Logged in as admin")

# 2. Get academic structure
db = SessionLocal()
schools = db.query(School).all()
depts = db.query(Department).all()
courses = db.query(Course).all()
db.close()

# 3. Create election
elec = post("/admin/elections", {
    "title": "Student Council Election 2026",
    "description": "Fresh election after database reset"
}, token)
elec_id = elec["id"]
print(f"Created election: {elec_id} - {elec['title']}")

# 4. Create University-level positions
uni_pos_names = [
    "President", "Deputy President", "Secretary General", "Treasurer",
    "Games Captain", "Events and Entertainment Captain",
    "PWD Representative 1", "PWD Representative 2"
]
positions = {}
for pname in uni_pos_names:
    pid = post("/admin/positions", {
        "election_id": elec_id,
        "name": pname,
        "level": "UNIVERSITY"
    }, token)["id"]
    positions[pname] = pid
    print(f"  Position: {pname}")

# 5. Create one sample candidate
cand = post("/admin/candidates", {
    "election_id": elec_id,
    "position_id": positions["President"],
    "name": "John Doe",
    "description": "Sample candidate for President"
}, token)
print(f"\nCandidate created: {cand['name']}")

print(f"\n[OK] Basic election setup complete!")
print(f"Election ID: {elec_id}")
print("\nUse the admin panel at http://localhost:5173/admin to:")
print("- Add more positions (School/Department/Class)")
print("- Add candidates")
print("- Activate election when ready")
