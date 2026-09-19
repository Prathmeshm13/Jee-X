"""Service 5: Edge Coins ledger, milestone/streak bonuses, and reward redemption.

award_coins() is the single writer to the ledger + the cached student_profiles.edge_coins
balance (models/rewards.py's module docstring explains the cache). These functions only
add()/flush() — callers commit(), matching every other router in this codebase owning the
commit boundary (see subject_test_attempts.py).
"""

from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models

IST = timezone(timedelta(hours=5, minutes=30))

MILESTONE_STEP = 50
MILESTONE_COINS = 10
DAILY_QUESTION_COINS = 1
STREAK_BONUSES = {7: 5, 30: 20, 100: 75}  # days -> one-time bonus coins


def today_ist() -> date:
    return datetime.now(IST).date()


def total_correct_answers(db: Session, user_id: int) -> int:
    return (
        db.query(func.count(models.QuestionResponse.id))
        .filter(models.QuestionResponse.user_id == user_id, models.QuestionResponse.outcome == "correct")
        .scalar()
        or 0
    )


def award_coins(
    db: Session,
    user: models.User,
    amount: int,
    reason: str,
    reference_id: int | None = None,
    note: str | None = None,
) -> models.EdgeCoinTransaction:
    profile = user.student_profile
    txn = models.EdgeCoinTransaction(user_id=user.id, amount=amount, reason=reason, reference_id=reference_id, note=note)
    db.add(txn)
    profile.edge_coins = (profile.edge_coins or 0) + amount
    db.flush()
    return txn


def check_and_award_milestones(db: Session, user: models.User, previously_correct_count: int, newly_correct_count: int) -> int:
    """Every MILESTONE_STEP cumulative correct answers (across all server-graded attempts,
    subject tests and daily questions alike) earns MILESTONE_COINS. Called once per submission
    with the correct-answer totals from just before and just after grading it, so a submission
    that crosses more than one boundary at once (e.g. a 10-question test) awards all of them.
    Returns the number of coins awarded (0 if none)."""
    crossed = newly_correct_count // MILESTONE_STEP - previously_correct_count // MILESTONE_STEP
    if crossed <= 0:
        return 0
    coins = crossed * MILESTONE_COINS
    award_coins(db, user, coins, reason="milestone", note=f"{crossed}x{MILESTONE_STEP}q")
    return coins


def _streak_bonus_already_awarded(db: Session, user_id: int, note: str) -> bool:
    return (
        db.query(models.EdgeCoinTransaction.id)
        .filter(
            models.EdgeCoinTransaction.user_id == user_id,
            models.EdgeCoinTransaction.reason == "streak_bonus",
            models.EdgeCoinTransaction.note == note,
        )
        .first()
        is not None
    )


def update_streak_and_award(db: Session, user: models.User, activity_date: date | None = None) -> int:
    """Call once when a daily question is submitted. Idempotent against a resubmit on the same
    day (returns 0). One-time streak-length bonuses are guarded against a broken-then-rebuilt
    streak re-hitting the same threshold twice via a ledger lookup, not just an in-memory check.
    Returns the total coins awarded this call (daily coin + any streak bonus)."""
    activity_date = activity_date or today_ist()
    profile = user.student_profile

    if profile.last_streak_date == activity_date:
        return 0

    if profile.last_streak_date == activity_date - timedelta(days=1):
        profile.current_streak = (profile.current_streak or 0) + 1
    else:
        profile.current_streak = 1
    profile.last_streak_date = activity_date
    profile.longest_streak = max(profile.longest_streak or 0, profile.current_streak)

    award_coins(db, user, DAILY_QUESTION_COINS, reason="daily_question", note=str(activity_date))
    earned = DAILY_QUESTION_COINS

    bonus = STREAK_BONUSES.get(profile.current_streak)
    if bonus:
        note = f"streak_{profile.current_streak}"
        if not _streak_bonus_already_awarded(db, user.id, note):
            award_coins(db, user, bonus, reason="streak_bonus", note=note)
            earned += bonus

    return earned


def redeem(db: Session, user: models.User, catalog_item: models.RewardCatalogItem, shipping: dict) -> models.RewardRedemption:
    """Raises ValueError on insufficient balance — routers map that to a 409."""
    profile = user.student_profile
    if (profile.edge_coins or 0) < catalog_item.cost_coins:
        raise ValueError("Insufficient Edge Coins balance.")

    redemption = models.RewardRedemption(
        user_id=user.id,
        catalog_item_id=catalog_item.id,
        coins_spent=catalog_item.cost_coins,
        status="pending",
        **shipping,
    )
    db.add(redemption)
    db.flush()
    award_coins(db, user, -catalog_item.cost_coins, reason="redemption", reference_id=redemption.id, note=catalog_item.name)
    return redemption
