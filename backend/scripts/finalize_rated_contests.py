"""Run every minute from backend: python scripts/finalize_rated_contests.py.
The ranking page also settles closed contests when visited.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from datetime import datetime, timezone
from app import models
from app.database import SessionLocal
from app.models.ranking import RatedContest
from app.services.ranking import finalize

with SessionLocal.begin() as db:
    rows = db.query(RatedContest).filter(
        RatedContest.closes_at <= datetime.now(timezone.utc).replace(tzinfo=None)
    ).order_by(RatedContest.closes_at, RatedContest.id).with_for_update().all()
    pending = sum(not c.finalized for c in rows)
    for contest in rows:
        finalize(db, contest)
print(f'Finalized {pending} contests.')
