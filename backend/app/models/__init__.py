"""SQLAlchemy models for the full JeeX schema (docs/database-schema.md).

Split by domain, all sharing app.database.Base, mirroring the layout suggested
in section 14 ("Suggested model layout") of the schema doc. Every class is
re-exported here so callers can keep doing `from app import models` and
`models.User`, as before the split.
"""

from app.models.admin import (
    AuditLog,
    ImportRun,
    IntegrityFlag,
    QuestionReport,
    QuestionRevision,
    QuestionReview,
    RegradeRun,
)
from app.models.content import Asset, Chapter, Passage, Question, QuestionOption, QuestionSubtopic, Subject, Subtopic
from app.models.identity import GuardianConsent, StudentProfile, User
from app.models.learning import StudentChapterCoverage, StudentSubtopicStats
from app.models.publishing import Leaderboard, LeaderboardEntry, ShareCard
from app.models.ratings import QuestionRating, RatingEvent, StudentRating, StudentSubjectRating
from app.models.tests import QuestionResponse, ResponseOption, Test, TestAttempt, TestQuestion

__all__ = [
    "User",
    "StudentProfile",
    "GuardianConsent",
    "Subject",
    "Chapter",
    "Subtopic",
    "Passage",
    "Question",
    "QuestionOption",
    "QuestionSubtopic",
    "Asset",
    "Test",
    "TestQuestion",
    "TestAttempt",
    "QuestionResponse",
    "ResponseOption",
    "StudentSubtopicStats",
    "StudentChapterCoverage",
    "StudentRating",
    "StudentSubjectRating",
    "QuestionRating",
    "RatingEvent",
    "Leaderboard",
    "LeaderboardEntry",
    "ShareCard",
    "ImportRun",
    "QuestionRevision",
    "QuestionReview",
    "QuestionReport",
    "RegradeRun",
    "IntegrityFlag",
    "AuditLog",
]
