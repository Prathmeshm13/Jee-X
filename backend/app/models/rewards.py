"""Edge Coins economy: an append-only transaction ledger, a redeemable catalog, redemption
requests, and personalized daily-question assignments. See app/services/rewards.py for the
earning rules and app/routers/daily_question.py + app/routers/rewards.py for the API surface.

Coins are cached on student_profiles.edge_coins (identity.py) for cheap reads, same pattern
test_attempts.score already uses — the ledger here is the source of truth, rebuildable from it.
"""

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class EdgeCoinTransaction(Base):
    __tablename__ = "edge_coin_transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)  # signed: positive = earned, negative = redeemed
    reason = Column(String(20), nullable=False)
    reference_id = Column(Integer, nullable=True)  # e.g. a daily_question_assignments.id
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "reason IN ('daily_question','milestone','streak_bonus','redemption','adjustment')",
            name="ck_edge_coin_transactions_reason",
        ),
    )


class RewardCatalogItem(Base):
    __tablename__ = "reward_catalog_items"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cost_coins = Column(Integer, nullable=False)
    is_active = Column(Boolean, nullable=False, server_default="1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    catalog_item_id = Column(Integer, ForeignKey("reward_catalog_items.id"), nullable=False)
    coins_spent = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False, server_default="pending")
    shipping_name = Column(String(255), nullable=False)
    shipping_line1 = Column(String(255), nullable=False)
    shipping_line2 = Column(String(255), nullable=True)
    shipping_city = Column(String(100), nullable=False)
    shipping_state = Column(String(100), nullable=False)
    shipping_pincode = Column(String(20), nullable=False)
    shipping_phone = Column(String(20), nullable=False)
    note = Column(Text, nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    fulfilled_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('pending','fulfilled','cancelled')", name="ck_reward_redemptions_status"),
    )

    catalog_item = relationship("RewardCatalogItem")


class DailyQuestionAssignment(Base):
    __tablename__ = "daily_question_assignments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    assigned_date = Column(Date, nullable=False)
    test_id = Column(Integer, ForeignKey("tests.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "assigned_date", name="uq_daily_question_assignments_user_date"),
    )

    question = relationship("Question")
    test = relationship("Test")
