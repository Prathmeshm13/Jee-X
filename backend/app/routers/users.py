from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import verify_token
from app.database import get_db

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/me")
def read_me(payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.auth0_sub == payload["sub"]).first()
    if not user:
        return {"onboarded": False, "profile": None}
    return {"onboarded": True, "profile": schemas.UserOut.model_validate(user)}


@router.get("/username-check/{username}", response_model=schemas.UsernameAvailability)
def check_username(username: str, db: Session = Depends(get_db)):
    username = username.strip().lower()
    exists = db.query(models.User).filter(models.User.username == username).first()
    return schemas.UsernameAvailability(username=username, available=exists is None)


@router.post("/onboarding", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def complete_onboarding(body: schemas.OnboardingIn, payload: dict = Depends(verify_token), db: Session = Depends(get_db)):
    sub = payload["sub"]
    email = payload.get("email")
    existing = db.query(models.User).filter(models.User.auth0_sub == sub).first()
    if existing:
        raise HTTPException(status_code=409, detail="Profile already exists for this account.")
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(status_code=409, detail="That username is already taken.")
    user = models.User(auth0_sub=sub, email=email, name=body.name, username=body.username, dob=body.dob, class_level=body.class_level)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/profile", response_model=schemas.UserOut)
def update_profile(
    body: schemas.ProfileUpdate,
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    sub = payload["sub"]
    user = db.query(models.User).filter(models.User.auth0_sub == sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="Complete onboarding before editing your profile.")

    taken = (
        db.query(models.User)
        .filter(models.User.username == body.username, models.User.auth0_sub != sub)
        .first()
    )
    if taken:
        raise HTTPException(status_code=409, detail="That username is already taken.")

    user.name = body.name
    user.username = body.username
    user.dob = body.dob
    user.class_level = body.class_level
    db.commit()
    db.refresh(user)
    return user
