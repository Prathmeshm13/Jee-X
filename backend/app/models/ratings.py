from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, func

from app.database import Base


class StudentRating(Base):
    __tablename__ = "student_ratings"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    rating = Column(Float, nullable=False, server_default="1500")
    deviation = Column(Float, nullable=False, server_default="350")
    volatility = Column(Float, nullable=False, server_default="0.06")
    attempts_counted = Column(Integer, nullable=False, server_default="0")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class StudentSubjectRating(Base):
    __tablename__ = "student_subject_ratings"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), primary_key=True)
    rating = Column(Float, nullable=False, server_default="1500")
    deviation = Column(Float, nullable=False, server_default="350")
    volatility = Column(Float, nullable=False, server_default="0.06")
    attempts_counted = Column(Integer, nullable=False, server_default="0")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class QuestionRating(Base):
    __tablename__ = "question_ratings"

    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True)
    rating = Column(Float, nullable=False, server_default="1500")
    deviation = Column(Float, nullable=False, server_default="350")
    responses_counted = Column(Integer, nullable=False, server_default="0")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class RatingEvent(Base):
    __tablename__ = "rating_events"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    attempt_id = Column(Integer, ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False)
    regrade_run_id = Column(Integer, ForeignKey("regrade_runs.id"), nullable=True)
    rating_before = Column(Float, nullable=False)
    rating_after = Column(Float, nullable=False)
    deviation_after = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
