import re
from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, field_validator

USERNAME_RE = re.compile(r"^[a-zA-Z0-9_]{3,20}$")


class OnboardingIn(BaseModel):
    name: str
    username: str
    dob: date
    class_level: Literal["11", "12", "dropper"]

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if not USERNAME_RE.match(v):
            raise ValueError("Username must be 3-20 characters: letters, numbers, underscore only.")
        return v

    @field_validator("dob")
    @classmethod
    def dob_reasonable(cls, v: date) -> date:
        age_days = (date.today() - v).days
        if age_days < 10 * 365 or age_days > 30 * 365:
            raise ValueError("Please enter a valid date of birth.")
        return v


class ProfileUpdate(BaseModel):
    name: str
    username: str
    dob: date
    class_level: Literal["11", "12", "dropper"]

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if not USERNAME_RE.match(v):
            raise ValueError("Username must be 3-20 characters: letters, numbers, underscore only.")
        return v

    @field_validator("dob")
    @classmethod
    def dob_reasonable(cls, v: date) -> date:
        age_days = (date.today() - v).days
        if age_days < 10 * 365 or age_days > 30 * 365:
            raise ValueError("Please enter a valid date of birth.")
        return v


class UserOut(BaseModel):
    id: int
    name: str
    username: str
    dob: date
    class_level: str
    email: str | None = None

    class Config:
        from_attributes = True


class UsernameAvailability(BaseModel):
    username: str
    available: bool


class SubjectBreakdown(BaseModel):
    correct: int
    total: int


class TestAttemptIn(BaseModel):
    test_type: Literal["free_diagnostic", "full_mock"] = "free_diagnostic"
    score: int
    total_questions: int
    accuracy: float
    avg_time_seconds: float
    subject_breakdown: dict[str, SubjectBreakdown]

    @field_validator("score", "total_questions")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Value must not be negative.")
        return v

    @field_validator("accuracy")
    @classmethod
    def accuracy_in_range(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("Accuracy must be between 0 and 100.")
        return v


class TestAttemptOut(BaseModel):
    id: int
    test_type: str
    score: int
    total_questions: int
    accuracy: float
    avg_time_seconds: float
    subject_breakdown: dict
    created_at: datetime


# ---------------------------------------------------------------------------
# Subject-wise tests: content catalog, test creation, submission/grading.
# ---------------------------------------------------------------------------


class SubjectOut(BaseModel):
    code: str
    name: str
    chapter_count: int
    published_question_count: int


class ChapterOut(BaseModel):
    id: int
    name: str
    slug: str
    class_level: str
    position: int
    published_question_count: int


class SubjectTestCreate(BaseModel):
    subject_code: Literal["PHY", "CHEM", "MATH"]
    chapter_id: int | None = None
    count: int = 10

    @field_validator("count")
    @classmethod
    def count_in_range(cls, v: int) -> int:
        if not (1 <= v <= 30):
            raise ValueError("count must be between 1 and 30.")
        return v


class TestOptionOut(BaseModel):
    id: int
    label: str
    content: str


class TestQuestionOut(BaseModel):
    question_id: int
    ref: str
    type: str
    stem: str
    passage: str | None = None
    options: list[TestOptionOut]
    marks_correct: int
    marks_wrong: int


class SubjectTestOut(BaseModel):
    attempt_id: int
    test_id: int
    title: str
    subject_code: str
    duration_sec: int
    questions: list[TestQuestionOut]


class SubjectTestAnswerIn(BaseModel):
    question_id: int
    option_ids: list[int] = []
    numeric_answer: float | None = None
    time_taken_sec: int = 0


class SubjectTestSubmitIn(BaseModel):
    answers: list[SubjectTestAnswerIn]


class QuestionResultOut(BaseModel):
    question_id: int
    ref: str
    outcome: str
    marks_awarded: int
    correct_option_ids: list[int]
    solution: str


class SubjectTestResultOut(BaseModel):
    attempt_id: int
    score: int
    total_questions: int
    accuracy: float
    avg_time_seconds: float
    subject_breakdown: dict
    questions: list[QuestionResultOut]
