from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class ImportRun(Base):
    __tablename__ = "import_runs"

    id = Column(Integer, primary_key=True)
    file_path = Column(String(1024), nullable=False)
    file_hash = Column(String(64), nullable=False)
    run_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    added = Column(Integer, nullable=False, server_default="0")
    updated = Column(Integer, nullable=False, server_default="0")
    errors = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class QuestionRevision(Base):
    __tablename__ = "question_revisions"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    content = Column(JSON, nullable=False)
    edited_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    import_run_id = Column(Integer, ForeignKey("import_runs.id"), nullable=True)
    change_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("question_id", "version", name="uq_question_revisions_question_version"),)

    question = relationship("Question", back_populates="revisions")


class QuestionReview(Base):
    __tablename__ = "question_reviews"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, nullable=False)
    version = Column(Integer, nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision = Column(String(20), nullable=False)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "decision IN ('approved','changes_requested','rejected')", name="ck_question_reviews_decision"
        ),
        ForeignKeyConstraint(
            ["question_id", "version"],
            ["question_revisions.question_id", "question_revisions.version"],
            ondelete="CASCADE",
            name="fk_question_reviews_revision",
        ),
    )


class QuestionReport(Base):
    __tablename__ = "question_reports"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, server_default="open")
    assigned_to = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (CheckConstraint("status IN ('open','fixed','rejected')", name="ck_question_reports_status"),)


class RegradeRun(Base):
    __tablename__ = "regrade_runs"

    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, nullable=False)
    from_version = Column(Integer, nullable=False)
    to_version = Column(Integer, nullable=False)
    report_id = Column(Integer, ForeignKey("question_reports.id"), nullable=True)
    triggered_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    responses_changed = Column(Integer, nullable=False, server_default="0")
    status = Column(String(20), nullable=False, server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint("status IN ('pending','running','done','failed')", name="ck_regrade_runs_status"),
        CheckConstraint("to_version > from_version", name="ck_regrade_runs_version_order"),
        ForeignKeyConstraint(
            ["question_id", "from_version"],
            ["question_revisions.question_id", "question_revisions.version"],
            name="fk_regrade_runs_from_revision",
        ),
        ForeignKeyConstraint(
            ["question_id", "to_version"],
            ["question_revisions.question_id", "question_revisions.version"],
            name="fk_regrade_runs_to_revision",
        ),
    )


class IntegrityFlag(Base):
    __tablename__ = "integrity_flags"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    attempt_id = Column(Integer, ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=True)
    kind = Column(String(30), nullable=False)
    details = Column(JSON, nullable=True)
    status = Column(String(20), nullable=False, server_default="open")
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "kind IN ('too_fast','answer_pattern_match','multi_account')", name="ck_integrity_flags_kind"
        ),
        CheckConstraint("status IN ('open','cleared','actioned')", name="ck_integrity_flags_status"),
    )


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
