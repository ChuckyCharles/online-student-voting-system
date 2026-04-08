import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Role(str, enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


class ElectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    ENDED = "ENDED"


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    student_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.STUDENT)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    voting_tokens: Mapped[list["VotingToken"]] = relationship(back_populates="user")


class Election(Base):
    __tablename__ = "elections"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[ElectionStatus] = mapped_column(Enum(ElectionStatus), default=ElectionStatus.PENDING)
    start_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    positions: Mapped[list["Position"]] = relationship(back_populates="election", cascade="all, delete")
    candidates: Mapped[list["Candidate"]] = relationship(back_populates="election", cascade="all, delete")


class Position(Base):
    __tablename__ = "positions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    election_id: Mapped[str] = mapped_column(ForeignKey("elections.id", ondelete="CASCADE"), index=True)

    election: Mapped["Election"] = relationship(back_populates="positions")
    candidates: Mapped[list["Candidate"]] = relationship(back_populates="position", cascade="all, delete")
    voting_tokens: Mapped[list["VotingToken"]] = relationship(back_populates="position")

    __table_args__ = (UniqueConstraint("name", "election_id"),)


class Candidate(Base):
    __tablename__ = "candidates"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    election_id: Mapped[str] = mapped_column(ForeignKey("elections.id", ondelete="CASCADE"), index=True)
    position_id: Mapped[str] = mapped_column(ForeignKey("positions.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    election: Mapped["Election"] = relationship(back_populates="candidates")
    position: Mapped["Position"] = relationship(back_populates="candidates")
    votes: Mapped[list["Vote"]] = relationship(back_populates="candidate", cascade="all, delete")


# Anonymity: VotingToken proves user voted for a position.
# Vote has no user_id — cannot be traced back to voter.
class VotingToken(Base):
    __tablename__ = "voting_tokens"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    position_id: Mapped[str] = mapped_column(ForeignKey("positions.id", ondelete="CASCADE"))
    used_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship(back_populates="voting_tokens")
    position: Mapped["Position"] = relationship(back_populates="voting_tokens")

    __table_args__ = (UniqueConstraint("user_id", "position_id"),)


class Vote(Base):
    __tablename__ = "votes"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    candidate_id: Mapped[str] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"), index=True)
    election_id: Mapped[str] = mapped_column(String, index=True)
    position_id: Mapped[str] = mapped_column(String, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    candidate: Mapped["Candidate"] = relationship(back_populates="votes")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    action: Mapped[str] = mapped_column(String)
    target: Mapped[str | None] = mapped_column(String, nullable=True)
    details: Mapped[str | None] = mapped_column(String, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
