from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models import Role, ElectionStatus


# Auth
class RegisterIn(BaseModel):
    name: str
    student_id: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str

class UserOut(BaseModel):
    id: str
    name: str
    student_id: str
    email: str
    role: Role
    created_at: datetime
    model_config = {"from_attributes": True}


# Elections
class ElectionCreate(BaseModel):
    title: str

class ElectionOut(BaseModel):
    id: str
    title: str
    status: ElectionStatus
    start_time: datetime | None
    end_time: datetime | None
    created_at: datetime
    model_config = {"from_attributes": True}

class StatusUpdate(BaseModel):
    status: ElectionStatus


# Positions
class PositionCreate(BaseModel):
    name: str
    election_id: str

class PositionOut(BaseModel):
    id: str
    name: str
    election_id: str
    model_config = {"from_attributes": True}


# Candidates
class CandidateCreate(BaseModel):
    name: str
    description: str | None = None
    position_id: str
    election_id: str

class CandidateUpdate(BaseModel):
    name: str | None = None
    description: str | None = None

class CandidateOut(BaseModel):
    id: str
    name: str
    description: str | None
    position_id: str
    election_id: str
    model_config = {"from_attributes": True}


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
