from sqlalchemy import CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, String, func

from app.database import Base


class Leaderboard(Base):
    __tablename__ = "leaderboards"

    id = Column(Integer, primary_key=True)
    kind = Column(String(20), nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=True)
    segment = Column(String(50), nullable=False, server_default="all")
    participants = Column(Integer, nullable=False, server_default="0")
    computed_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    superseded_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("kind IN ('test','rating')", name="ck_leaderboards_kind"),
        CheckConstraint("(kind = 'test') = (test_id IS NOT NULL)", name="ck_leaderboards_test_id"),
    )


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    leaderboard_id = Column(Integer, ForeignKey("leaderboards.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    rank = Column(Integer, nullable=False)
    display_name = Column(String(150), nullable=False)
    score = Column(Integer, nullable=True)
    percentile = Column(Float, nullable=True)
    rating = Column(Float, nullable=True)

    __table_args__ = (Index("ix_leaderboard_entries_rank", "leaderboard_id", "rank"),)


class ShareCard(Base):
    __tablename__ = "share_cards"

    token = Column(String(64), primary_key=True)
    attempt_id = Column(Integer, ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked_at = Column(DateTime(timezone=True), nullable=True)
