from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models import Role, ElectionStatus, PositionLevel


# Auth
class RegisterIn(BaseModel):
    name: str
    student_id: str
    email: EmailStr
    password: str
    school_id: str
    department_id: str
    course_id: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    school_id: str | None = None
    department_id: str | None = None
    course_id: str | None = None

class UserOut(BaseModel):
    id: str
    name: str
    student_id: str
    email: str
    role: Role
    school_id: str | None = None
    department_id: str | None = None
    course_id: str | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


# Elections
class ElectionCreate(BaseModel):
    title: str
    description: str | None = None

class PositionInElection(BaseModel):
    id: str
    name: str
    level: PositionLevel
    school_id: str | None = None
    department_id: str | None = None
    course_id: str | None = None
    candidates: list["CandidateInElection"] = []
    model_config = {"from_attributes": True}

class CandidateInElection(BaseModel):
    id: str
    name: str
    description: str | None = None
    photo_url: str | None = Field(default=None, alias='image_url')
    
    model_config = {"from_attributes": True, "populate_by_name": True}

class ElectionOut(BaseModel):
    id: str
    title: str
    description: str | None
    status: ElectionStatus
    start_time: datetime | None
    end_time: datetime | None
    created_at: datetime
    positions: list[PositionInElection] = []
    model_config = {"from_attributes": True}

class StatusUpdate(BaseModel):
    status: ElectionStatus


class ElectionTimeUpdate(BaseModel):
    start_time: datetime | None = None
    end_time: datetime | None = None


# Positions
class PositionCreate(BaseModel):
    name: str
    election_id: str
    level: PositionLevel = PositionLevel.UNIVERSITY
    school_id: str | None = None
    department_id: str | None = None
    course_id: str | None = None

class PositionOut(BaseModel):
    id: str
    name: str
    election_id: str
    level: PositionLevel
    school_id: str | None = None
    department_id: str | None = None
    course_id: str | None = None
    model_config = {"from_attributes": True}


# Candidates
class CandidateCreate(BaseModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    position_id: str
    election_id: str

class CandidateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None

class PositionForCandidate(BaseModel):
    id: str
    name: str
    model_config = {"from_attributes": True}

class ElectionForCandidate(BaseModel):
    id: str
    title: str
    model_config = {"from_attributes": True}

class CandidateOut(BaseModel):
    id: str
    name: str
    description: str | None
    photo_url: str | None = Field(default=None, alias='image_url')
    position_id: str
    election_id: str
    position: PositionForCandidate | None = None
    election: ElectionForCandidate | None = None
    
    model_config = {"from_attributes": True, "populate_by_name": True}


# Voting
class VoteIn(BaseModel):
    candidate_id: str
    position_id: str
    election_id: str


# Results
class CandidateResult(BaseModel):
    id: str
    name: str
    votes: int

class PositionResult(BaseModel):
    position: str
    candidates: list[CandidateResult]


# Audit
class AuditLogOut(BaseModel):
    id: str
    user_id: str
    action: str
    target: str | None = None
    details: str | None = None
    ip_address: str | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


# Academic Structure  
class SchoolOut(BaseModel):
    id: str
    name: str
    model_config = {"from_attributes": True}


class SchoolUpdate(BaseModel):
    name: str | None = None


class SchoolCreate(BaseModel):
    name: str


class DepartmentOut(BaseModel):
    id: str
    name: str
    school_id: str
    model_config = {"from_attributes": True}


class DepartmentUpdate(BaseModel):
    name: str | None = None
    school_id: str | None = None


class DepartmentCreate(BaseModel):
    name: str
    school_id: str


class CourseOut(BaseModel):
    id: str
    name: str
    code: str | None = None
    department_id: str
    model_config = {"from_attributes": True}


class CourseUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    department_id: str | None = None


class CourseCreate(BaseModel):
    name: str
    code: str | None = None
    department_id: str
