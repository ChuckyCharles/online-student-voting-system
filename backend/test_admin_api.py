"""Comprehensive tests for all admin API endpoints."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.database import Base, get_db
from app.main import app
from app.models import (
    User, Election, Position, Candidate, School,
    Department, Course, Role, ElectionStatus, PositionLevel, AuditLog
)
from app.auth import hash_password, create_token
from app.schemas import StatusUpdate
import cuid2

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)
client = TestClient(app)

# Override get_db to use test database
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db


def setup_function():
    """Set up test data before each test."""
    db = TestingSessionLocal()
    # Clear all data
    db.query(Candidate).delete()
    db.query(Position).delete()
    db.query(Election).delete()
    db.query(Course).delete()
    db.query(Department).delete()
    db.query(School).delete()
    db.query(User).delete()
    db.query(AuditLog).delete()
    
    # Create admin user
    admin = User(
        id="admin-test-001",
        name="Admin",
        student_id="ADMIN001",
        email="admin@university.edu",
        password=hash_password("Admin@123"),
        role=Role.ADMIN
    )
    db.add(admin)
    
    # Create student user
    student = User(
        id="student-test-001",
        name="Test Student",
        student_id="STU001",
        email="student1@university.edu",
        password=hash_password("Student@123"),
        role=Role.STUDENT
    )
    db.add(student)
    
    # Create school
    school = School(id="school-test-001", name="Test School")
    db.add(school)
    
    # Create department
    dept = Department(id="dept-test-001", name="Test Department", school_id="school-test-001")
    db.add(dept)
    
    # Create course
    course = Course(id="course-test-001", name="Test Course", code="TEST101", department_id="dept-test-001")
    db.add(course)
    
    # Create election
    election = Election(
        id="election-test-001",
        title="Test Election",
        description="Description",
        status=ElectionStatus.PENDING
    )
    db.add(election)
    
    # Create position
    position = Position(
        id="position-test-001",
        name="Test Position",
        election_id="election-test-001",
        level=PositionLevel.UNIVERSITY
    )
    db.add(position)
    
    # Create candidate
    candidate = Candidate(
        id="candidate-test-001",
        name="Test Candidate",
        description="Description",
        image_url="http://example.com/image.jpg",
        election_id="election-test-001",
        position_id="position-test-001"
    )
    db.add(candidate)
    
    db.commit()
    db.close()


def teardown_function():
    """Clean up after each test."""
    db = TestingSessionLocal()
    db.query(Candidate).delete()
    db.query(Position).delete()
    db.query(Election).delete()
    db.query(Course).delete()
    db.query(Department).delete()
    db.query(School).delete()
    db.query(User).delete()
    db.query(AuditLog).delete()
    db.commit()
    db.close()


def login_as_admin():
    """Login as admin and get tokens."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@university.edu", "password": "Admin@123"}
    )
    return response.json()


def get_test_user(db: Session):
    """Get a test admin user from the database."""
    user = db.query(User).filter(User.email == "admin@university.edu").first()
    if not user:
        user = User(
            id="admin-test-001",
            name="Admin",
            student_id="ADMIN001",
            email="admin@university.edu",
            password=hash_password("Admin@123"),
            role=Role.ADMIN
        )
        db.add(user)
        db.commit()
    return user


def get_auth_headers(db: Session = None):
    """Get authentication headers for admin user."""
    if db is None:
        db = TestingSessionLocal()
    user = get_test_user(db)
    token = create_token({"sub": user.id, "role": user.role.value, "email": user.email})
    return {"Authorization": f"Bearer {token}"}


# ── Stats ──────────────────────────────────────────────────────────────────
def test_get_admin_stats():
    """Test GET /admin/stats endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_students" in data
    assert "total_votes" in data
    assert "elections" in data
    assert "recent_logs" in data
    assert data["total_students"] >= 1


# ── Audit Logs ─────────────────────────────────────────────────────────────
def test_get_audit_logs():
    """Test GET /admin/audit-logs endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/audit-logs",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_audit_logs_with_pagination():
    """Test GET /admin/audit-logs with pagination."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/audit-logs?skip=0&limit=10",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# ── Elections ──────────────────────────────────────────────────────────────
def test_list_elections():
    """Test GET /admin/elections endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/elections",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_election():
    """Test POST /admin/elections endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    election_data = {
        "title": "New Election",
        "description": "Test election description"
    }
    response = client.post(
        "/admin/elections",
        json=election_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "New Election"
    assert data["description"] == "Test election description"
    assert "id" in data


def test_update_election_status():
    """Test PATCH /admin/elections/{election_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    status_update = {"status": "ACTIVE"}
    response = client.patch(
        "/admin/elections/election-test-001",
        json=status_update,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ACTIVE"
    assert data["start_time"] is not None


def test_update_election_status_to_ended():
    """Test PATCH /admin/elections/{election_id} to ENDED status."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    # First activate
    client.patch(
        "/admin/elections/election-test-001",
        json={"status": "ACTIVE"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Then end
    response = client.patch(
        "/admin/elections/election-test-001",
        json={"status": "ENDED"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ENDED"
    assert data["end_time"] is not None


def test_delete_election():
    """Test DELETE /admin/elections/{election_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    # Create a new election to delete
    election_data = {
        "title": "Election To Delete",
        "description": "Will be deleted"
    }
    create_resp = client.post(
        "/admin/elections",
        json=election_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    election_id = create_resp.json()["id"]
    
    # Delete it
    response = client.delete(
        f"/admin/elections/{election_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deleted"


# ── Positions ──────────────────────────────────────────────────────────────
def test_create_position():
    """Test POST /admin/positions endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    position_data = {
        "name": "New Position",
        "election_id": "election-test-001",
        "level": "UNIVERSITY"
    }
    response = client.post(
        "/admin/positions",
        json=position_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Position"
    assert data["election_id"] == "election-test-001"
    assert data["level"] == "UNIVERSITY"


def test_create_position_with_school():
    """Test POST /admin/positions endpoint with SCHOOL level."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    position_data = {
        "name": "School Rep",
        "election_id": "election-test-001",
        "level": "SCHOOL",
        "school_id": "school-test-001"
    }
    response = client.post(
        "/admin/positions",
        json=position_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["level"] == "SCHOOL"
    assert data["school_id"] == "school-test-001"


def test_delete_position():
    """Test DELETE /admin/positions/{position_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    # Create a new position to delete
    position_data = {
        "name": "Position To Delete",
        "election_id": "election-test-001",
        "level": "UNIVERSITY"
    }
    create_resp = client.post(
        "/admin/positions",
        json=position_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    position_id = create_resp.json()["id"]
    
    # Delete it
    response = client.delete(
        f"/admin/positions/{position_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deleted"


# ── Candidates ─────────────────────────────────────────────────────────────
def test_list_candidates():
    """Test GET /admin/candidates endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/candidates",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_create_candidate():
    """Test POST /admin/candidates endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    candidate_data = {
        "name": "New Candidate",
        "description": "Candidate description",

        "position_id": "position-test-001",
        "election_id": "election-test-001"
    }
    response = client.post(
        "/admin/candidates",
        json=candidate_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Candidate"
    assert data["position_id"] == "position-test-001"


def test_create_duplicate_candidate():
    """Test POST /admin/candidates with duplicate name."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    candidate_data = {
        "name": "Test Candidate",
        "position_id": "position-test-001",
        "election_id": "election-test-001"
    }
    response = client.post(
        "/admin/candidates",
        json=candidate_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 409


def test_update_candidate():
    """Test PATCH /admin/candidates/{candidate_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    update_data = {
        "name": "Updated Candidate Name",
        "description": "Updated description"
    }
    response = client.patch(
        "/admin/candidates/candidate-test-001",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Candidate Name"


def test_delete_candidate():
    """Test DELETE /admin/candidates/{candidate_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.delete(
        "/admin/candidates/candidate-test-001",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deleted"


# ── Users ──────────────────────────────────────────────────────────────────
def test_list_users():
    """Test GET /admin/users endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_delete_user():
    """Test DELETE /admin/users/{user_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    # Create a student to delete
    db = TestingSessionLocal()
    new_user = User(
        id="student-to-delete",
        name="To Delete",
        student_id="TODEL001",
        email="todelete@university.edu",
        password=hash_password("Temp@123"),
        role=Role.STUDENT
    )
    db.add(new_user)
    db.commit()
    db.close()
    
    response = client.delete(
        "/admin/users/student-to-delete",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deleted"


# ── Academic Structure ─────────────────────────────────────────────────────
def test_list_schools():
    """Test GET /admin/schools endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/schools",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_list_departments():
    """Test GET /admin/departments endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/departments",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_departments_with_school_id():
    """Test GET /admin/departments with school_id filter."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/departments?school_id=school-test-001",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_courses():
    """Test GET /admin/courses endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/courses",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_list_courses_with_department_id():
    """Test GET /admin/courses with department_id filter."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    response = client.get(
        "/admin/courses?department_id=dept-test-001",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_create_school():
    """Test POST /admin/schools endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    school_data = {"name": "New School"}
    response = client.post(
        "/admin/schools",
        json=school_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New School"


def test_create_department():
    """Test POST /admin/departments endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    dept_data = {
        "name": "New Department",
        "school_id": "school-test-001"
    }
    response = client.post(
        "/admin/departments",
        json=dept_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Department"
    assert data["school_id"] == "school-test-001"


def test_create_course():
    """Test POST /admin/courses endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    course_data = {
        "name": "New Course",
        "department_id": "dept-test-001"
    }
    response = client.post(
        "/admin/courses",
        json=course_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Course"
    assert data["department_id"] == "dept-test-001"


def test_update_school():
    """Test PUT /admin/schools/{school_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    update_data = {"name": "Updated School Name"}
    response = client.put(
        "/admin/schools/school-test-001",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated School Name"


def test_update_department():
    """Test PUT /admin/departments/{department_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    update_data = {
        "name": "Updated Department Name",
        "school_id": "school-test-001"
    }
    response = client.put(
        "/admin/departments/dept-test-001",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Department Name"


def test_update_course():
    """Test PUT /admin/courses/{course_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    update_data = {
        "name": "Updated Course Name",
        "department_id": "dept-test-001"
    }
    response = client.put(
        "/admin/courses/course-test-001",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Course Name"
    assert data["department_id"] == "dept-test-001"


def test_delete_school():
    """Test DELETE /admin/schools/{school_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    # Create a school to delete
    school_data = {"name": "School To Delete"}
    create_resp = client.post(
        "/admin/schools",
        json=school_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    school_id = create_resp.json()["id"]
    
    # Delete it
    response = client.delete(
        f"/admin/schools/{school_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deleted"


def test_delete_department():
    """Test DELETE /admin/departments/{department_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    # Create a department to delete
    dept_data = {
        "name": "Department To Delete",
        "school_id": "school-test-001"
    }
    create_resp = client.post(
        "/admin/departments",
        json=dept_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    dept_id = create_resp.json()["id"]
    
    # Delete it
    response = client.delete(
        f"/admin/departments/{dept_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deleted"


def test_delete_course():
    """Test DELETE /admin/courses/{course_id} endpoint."""
    login_resp = login_as_admin()
    token = login_resp["access_token"]
    
    # Create a course to delete
    course_data = {
        "name": "Course To Delete",
        "department_id": "dept-test-001"
    }
    create_resp = client.post(
        "/admin/courses",
        json=course_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    course_id = create_resp.json()["id"]
    
    # Delete it
    response = client.delete(
        f"/admin/courses/{course_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Deleted"


# ── Unauthorized Access Tests ───────────────────────────────────────────────
def test_unauthorized_access_stats():
    """Test that unauthorized users cannot access /admin/stats."""
    response = client.get("/admin/stats")
    # No auth token -> FastAPI's HTTPBearer returns 401 for missing credentials
    # but in practice returns 403 (known FastAPI/Starlette behavior)
    assert response.status_code in (401, 403)


def test_unauthorized_access_audit_logs():
    """Test that unauthorized users cannot access /admin/audit-logs."""
    response = client.get("/admin/audit-logs")
    # No auth token -> returns 401 or 403
    assert response.status_code in (401, 403)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
