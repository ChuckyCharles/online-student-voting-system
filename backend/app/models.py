from sqlalchemy import String, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from sqlalchemy.sql import func
import enum

from app.database import Base


# ---------------------------
# ENUMS
# ---------------------------

class Role(str, enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


class ElectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    ENDED = "ENDED"


class PositionLevel(str, enum.Enum):
    UNIVERSITY = "UNIVERSITY"
    SCHOOL = "SCHOOL"
    DEPARTMENT = "DEPARTMENT"
    CLASS = "CLASS"


# ---------------------------
# SCHOOL
# ---------------------------

class School(Base):
    __tablename__ = "schools"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    departments: Mapped[list["Department"]] = relationship(
        back_populates="school", cascade="all, delete"
    )


# ---------------------------
# DEPARTMENT
# ---------------------------

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    school_id: Mapped[str] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    school: Mapped["School"] = relationship(back_populates="departments")
    courses: Mapped[list["Course"]] = relationship(
        back_populates="department", cascade="all, delete"
    )

    __table_args__ = (UniqueConstraint("name", "school_id"),)


# ---------------------------
# COURSE (FIXED WITH CODE)
# ---------------------------

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    code: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)  # ✅ FIXED
    department_id: Mapped[str] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    department: Mapped["Department"] = relationship(back_populates="courses")

    __table_args__ = (UniqueConstraint("name", "department_id"),)


# ---------------------------
# USER
# ---------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    student_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.STUDENT)

    school_id: Mapped[str | None] = mapped_column(
        ForeignKey("schools.id", ondelete="SET NULL"), nullable=True
    )
    department_id: Mapped[str | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"), nullable=True
    )
    course_id: Mapped[str | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    voting_tokens: Mapped[list["VotingToken"]] = relationship(
        back_populates="user"
    )


# ---------------------------
# ELECTION
# ---------------------------

class Election(Base):
    __tablename__ = "elections"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[ElectionStatus] = mapped_column(
        Enum(ElectionStatus), default=ElectionStatus.PENDING
    )

    start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    positions: Mapped[list["Position"]] = relationship(
        back_populates="election", cascade="all, delete"
    )
    candidates: Mapped[list["Candidate"]] = relationship(
        back_populates="election", cascade="all, delete"
    )


# ---------------------------
# POSITION
# ---------------------------

class Position(Base):
    __tablename__ = "positions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    election_id: Mapped[str] = mapped_column(
        ForeignKey("elections.id", ondelete="CASCADE"), index=True
    )

    level: Mapped[PositionLevel] = mapped_column(
        Enum(PositionLevel), default=PositionLevel.UNIVERSITY
    )

    school_id: Mapped[str | None] = mapped_column(
        ForeignKey("schools.id", ondelete="CASCADE"), nullable=True
    )
    department_id: Mapped[str | None] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"), nullable=True
    )
    course_id: Mapped[str | None] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), nullable=True
    )

    election: Mapped["Election"] = relationship(back_populates="positions")
    candidates: Mapped[list["Candidate"]] = relationship(
        back_populates="position", cascade="all, delete"
    )
    voting_tokens: Mapped[list["VotingToken"]] = relationship(
        back_populates="position"
    )

    __table_args__ = (UniqueConstraint("name", "election_id"),)


# ---------------------------
# CANDIDATE
# ---------------------------

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    election_id: Mapped[str] = mapped_column(
        ForeignKey("elections.id", ondelete="CASCADE"), index=True
    )
    position_id: Mapped[str] = mapped_column(
        ForeignKey("positions.id", ondelete="CASCADE"), index=True
    )

    running_mate_id: Mapped[str | None] = mapped_column(
        ForeignKey("candidates.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    election: Mapped["Election"] = relationship(back_populates="candidates")
    position: Mapped["Position"] = relationship(back_populates="candidates")
    votes: Mapped[list["Vote"]] = relationship(
        back_populates="candidate", cascade="all, delete"
    )

    running_mate: Mapped["Candidate"] = relationship(
        "Candidate", remote_side=[id], foreign_keys=[running_mate_id]
    )


# ---------------------------
# VOTING TOKEN
# ---------------------------

class VotingToken(Base):
    __tablename__ = "voting_tokens"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    position_id: Mapped[str] = mapped_column(
        ForeignKey("positions.id", ondelete="CASCADE")
    )

    used_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship(back_populates="voting_tokens")
    position: Mapped["Position"] = relationship(back_populates="voting_tokens")

    __table_args__ = (UniqueConstraint("user_id", "position_id"),)


# ---------------------------
# VOTE
# ---------------------------

class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    candidate_id: Mapped[str] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"), index=True
    )
    election_id: Mapped[str] = mapped_column(String, index=True)
    position_id: Mapped[str] = mapped_column(String, index=True)

    timestamp: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    candidate: Mapped["Candidate"] = relationship(back_populates="votes")


# ---------------------------
# AUDIT LOG
# ---------------------------

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    action: Mapped[str] = mapped_column(String)
    target: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[str | None] = mapped_column(String, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())