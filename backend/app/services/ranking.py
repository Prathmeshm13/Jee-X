"""Version 1: simultaneous pairwise Elo, three provisional contests, no decay."""
from datetime import datetime, timedelta

TITLES = ['Aspirant', 'Explorer', 'Challenger', 'Achiever', 'Scholar', 'Strategist', 'Ace', 'Topper', 'Ranker', 'Legend']
TIERS = [dict(title=t, minimum=1 if i == 0 else i * 500,
              maximum=5000 if i == 9 else (i + 1) * 500 - 1) for i, t in enumerate(TITLES)]


def tier(rating):
    return TIERS[min(9, max(0, int(rating) // 500))]


def calculate_updates(players):
    """(user_id, score, old_rating, completed_contests) -> new rating.

    Equal scores tie. All expectations use pre-contest ratings. A lone entrant
    receives no adjustment and does not complete a placement contest.
    """
    if len(players) < 2:
        return {p[0]: p[2] for p in players}
    result = {}
    for uid, score, old, count in players:
        total = 0
        for other, other_score, other_rating, _ in players:
            if other == uid:
                continue
            actual = 1 if score > other_score else 0 if score < other_score else .5
            expected = 1 / (1 + 10 ** ((other_rating - old) / 800))
            total += actual - expected
        k = 400 if count < 3 else 160
        result[uid] = max(1, min(5000, round(old + k * total / (len(players) - 1))))
    return result


def grade(questions, answers):
    score = 0
    for q in questions:
        a = answers.get(str(q['id']), {})
        if q['type'] == 'numerical':
            value = a.get('numeric_answer')
            if value is None:
                continue
            correct = q['answer_min'] <= value <= q['answer_max']
        else:
            chosen = set(a.get('option_ids', []))
            if not chosen:
                continue
            correct = chosen == set(q['correct_option_ids'])
        score += 4 if correct else -1
    return score


def finalize(db, contest, now=None):
    """Caller holds the contest lock. One transaction covers all rating writes."""
    from app.models.ranking import ContestEntry, JeeXRating
    now = now or datetime.utcnow()
    if contest.finalized or now < contest.closes_at:
        return
    # Locking reads see saves committed while waiting, even under MySQL REPEATABLE READ.
    entries = db.query(ContestEntry).filter_by(contest_id=contest.id).order_by(ContestEntry.user_id).with_for_update().populate_existing().all()
    accounts = {}
    for e in entries:
        e.score = grade(contest.questions, e.answers)
        if e.submitted_at is None:
            e.submitted_at = e.deadline
        account = db.query(JeeXRating).filter_by(user_id=e.user_id, exam=contest.exam, target_year=contest.target_year).with_for_update().one()
        accounts[e.user_id] = account
    updates = calculate_updates([(e.user_id, e.score, accounts[e.user_id].rating, accounts[e.user_id].contests) for e in entries])
    for e in entries:
        account = accounts[e.user_id]
        e.rank = 1 + sum(other.score > e.score for other in entries)
        if len(entries) < 2:
            continue
        e.rating_before = account.rating
        e.rating_after = updates[e.user_id]
        account.rating = e.rating_after
        account.contests += 1
        if account.contests >= 3:
            account.peak = max(account.peak, account.rating)
        account.last_rated_at = contest.closes_at
    contest.finalized = True


def summary(account):
    count = account.contests if account else 0
    rated = count >= 3
    value = account.rating if rated else None
    current = tier(value) if rated else None
    following = TIERS[TIERS.index(current) + 1] if current and current != TIERS[-1] else None
    return dict(rating=value, title=current['title'] if current else 'Unrated',
                placements_completed=min(count, 3), contests=count,
                peak=account.peak if rated else None, next_tier=following,
                points_to_next=following['minimum'] - value if following else None,
                badges=[t for t in TIERS if rated and t['minimum'] <= account.peak],
                active=bool(account and account.last_rated_at and account.last_rated_at >= datetime.utcnow() - timedelta(days=30)))
