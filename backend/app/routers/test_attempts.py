import json

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.deps import get_current_db_user
from app.database import get_db

router = APIRouter(prefix="/api/test-attempts", tags=["test-attempts"])


def _to_out(attempt: models.TestAttempt) -> schemas.TestAttemptOut:
    return schemas.TestAttemptOut(
        id=attempt.id,
        test_type=attempt.test_type,
        score=attempt.score,
        total_questions=attempt.total_questions,
        accuracy=attempt.accuracy,
        avg_time_seconds=attempt.avg_time_seconds,
        subject_breakdown=json.loads(attempt.subject_breakdown),
        created_at=attempt.created_at,
    )


@router.post("", response_model=schemas.TestAttemptOut, status_code=201)
def create_test_attempt(
    body: schemas.TestAttemptIn,
    user: models.User = Depends(get_current_db_user),
    db: Session = Depends(get_db),
):
    attempt = models.TestAttempt(
        user_id=user.id,
        test_type=body.test_type,
        score=body.score,
        total_questions=body.total_questions,
        accuracy=body.accuracy,
        avg_time_seconds=body.avg_time_seconds,
        subject_breakdown=json.dumps({k: v.model_dump() for k, v in body.subject_breakdown.items()}),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return _to_out(attempt)


@router.get("", response_model=list[schemas.TestAttemptOut])
def list_test_attempts(
    user: models.User = Depends(get_current_db_user),
    db: Session = Depends(get_db),
):
    attempts = (
        db.query(models.TestAttempt)
        .filter(models.TestAttempt.user_id == user.id)
        .order_by(models.TestAttempt.created_at.desc())
        .all()
    )
    return [_to_out(a) for a in attempts]
