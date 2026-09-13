from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    auth0_sub = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, index=True, nullable=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    dob = Column(Date, nullable=False)
    class_level = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    test_attempts = relationship("TestAttempt", back_populates="user", cascade="all, delete-orphan")


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    test_type = Column(String, nullable=False, default="free_diagnostic")
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    accuracy = Column(Float, nullable=False)
    avg_time_seconds = Column(Float, nullable=False)
    # Stored as JSON text, e.g. {"Physics": {"correct": 3, "total": 4}, ...}
    subject_breakdown = Column(Text, nullable=False, default="{}")

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="test_attempts")
