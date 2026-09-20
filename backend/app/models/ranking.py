"""JeeX contest ratings. Additive tables; legacy ratings remain untouched."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, UniqueConstraint
from app.database import Base


class JeeXRating(Base):
    __tablename__ = 'jeex_ratings'
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    exam = Column(String(20), primary_key=True)
    target_year = Column(Integer, primary_key=True)
    rating = Column(Integer, nullable=False, default=1500)
    peak = Column(Integer, nullable=False, default=0)
    contests = Column(Integer, nullable=False, default=0)
    last_rated_at = Column(DateTime, nullable=True)


class RatedContest(Base):
    __tablename__ = 'rated_contests'
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    exam = Column(String(20), nullable=False)
    target_year = Column(Integer, nullable=False)
    opens_at = Column(DateTime, nullable=False)
    closes_at = Column(DateTime, nullable=False)
    duration_sec = Column(Integer, nullable=False)
    # Immutable snapshots prevent question edits from changing a live contest.
    questions = Column(JSON, nullable=False)
    finalized = Column(Boolean, nullable=False, default=False)


class ContestEntry(Base):
    __tablename__ = 'contest_entries'
    id = Column(Integer, primary_key=True)
    contest_id = Column(Integer, ForeignKey('rated_contests.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    started_at = Column(DateTime, nullable=False)
    deadline = Column(DateTime, nullable=False)
    submitted_at = Column(DateTime, nullable=True)
    answers = Column(JSON, nullable=False, default=dict)
    score = Column(Integer, nullable=True)
    rank = Column(Integer, nullable=True)
    rating_before = Column(Integer, nullable=True)
    rating_after = Column(Integer, nullable=True)
    __table_args__ = (UniqueConstraint('contest_id', 'user_id', name='uq_contest_user'),)
