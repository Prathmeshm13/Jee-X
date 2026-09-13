from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.auth import verify_token
from app.database import get_db


def get_current_db_user(
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
) -> models.User:
    """
    Resolves the verified Auth0 token to a row in our own users table.
    404s if the account exists in Auth0 but hasn't completed onboarding yet —
    callers should route the user to /onboarding in that case.
    """
    user = db.query(models.User).filter(models.User.auth0_sub == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Complete onboarding before continuing.")
    return user
