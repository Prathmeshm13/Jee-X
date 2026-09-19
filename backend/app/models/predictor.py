"""Reference data + computed predictions for the rank/percentile/college predictor feature.

Reference tables are loaded from docs/JEE-Predictor-Data/jee-predictor-data/data/*.json by
app/predictor_importer.py (see scripts/import_predictor_data.py). Keys mirror the ones that
data pack's README documents, e.g. the JoSAA cutoff composite key and the marks/percentile
anchor keys — see that README's "Database fields and indexes" section.

General/CRL category only for now: student_profiles.category/pwd (identity.py) are already
optional columns but nothing sets them yet, and college matching here is deliberately scoped to
the AI (all-India) + OS (other-state) quotas, Gender-Neutral pool, CRL rank list — never HS
(home-state), since a student's home state and category aren't collected. See
app/services/predictor.py's match_colleges() for why OS and not HS. Widening this is a natural
follow-up, not built here.
"""

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from app.database import Base


class PredictorImportRun(Base):
    """One row per imported data-pack file. Mirrors models.admin.ImportRun's shape."""

    __tablename__ = "predictor_import_runs"

    id = Column(Integer, primary_key=True)
    file_path = Column(String(1024), nullable=False)
    file_hash = Column(String(64), nullable=False)
    added = Column(Integer, nullable=False, server_default="0")
    updated = Column(Integer, nullable=False, server_default="0")
    errors = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PredictorInstitute(Base):
    __tablename__ = "predictor_institutes"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)

    programs = relationship("PredictorProgram", back_populates="institute")


class PredictorProgram(Base):
    __tablename__ = "predictor_programs"

    id = Column(Integer, primary_key=True)
    institute_id = Column(Integer, ForeignKey("predictor_institutes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)

    __table_args__ = (UniqueConstraint("institute_id", "name", name="uq_predictor_programs_institute_name"),)

    institute = relationship("PredictorInstitute", back_populates="programs")


class PredictorJosaaCutoff(Base):
    """One JoSAA opening/closing rank row for one year+round+institute+program+seat combo."""

    __tablename__ = "predictor_josaa_cutoffs"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    counselling = Column(String(20), nullable=False)
    round = Column(Integer, nullable=False)
    institute_id = Column(Integer, ForeignKey("predictor_institutes.id"), nullable=False, index=True)
    program_id = Column(Integer, ForeignKey("predictor_programs.id"), nullable=False, index=True)
    quota = Column(String(10), nullable=False)
    seat_type = Column(String(20), nullable=False)
    gender_pool = Column(String(50), nullable=False)
    exam_route = Column(String(30), nullable=False)
    rank_list = Column(String(20), nullable=False)
    opening_rank = Column(Integer, nullable=True)
    closing_rank = Column(Integer, nullable=True)
    opening_is_preparatory = Column(Boolean, nullable=False, server_default="0")
    closing_is_preparatory = Column(Boolean, nullable=False, server_default="0")
    opening_rank_raw = Column(String(50), nullable=True)
    closing_rank_raw = Column(String(50), nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "year", "counselling", "round", "institute_id", "program_id", "quota", "seat_type", "gender_pool",
            name="uq_predictor_josaa_cutoffs_key",
        ),
    )

    institute = relationship("PredictorInstitute")
    program = relationship("PredictorProgram")


class PredictorMainPercentileAnchor(Base):
    """A published (rank, percentile) observation for JEE Main, used to interpolate rank<->percentile."""

    __tablename__ = "predictor_main_percentile_anchors"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    exam = Column(String(30), nullable=False)
    rank_list = Column(String(20), nullable=False)
    rank = Column(Integer, nullable=False)
    percentile_display = Column(Float, nullable=False)
    source_type = Column(String(40), nullable=False)
    source_url = Column(String(1024), nullable=True)

    __table_args__ = (
        UniqueConstraint("exam", "year", "rank_list", "rank", name="uq_predictor_main_percentile_key"),
    )


class PredictorMainMarksEstimate(Base):
    """Publisher marks->percentile bands. 'generic_estimate' rows (session/shift null) drive the
    default percentile-from-marks curve; 'shift_estimate' rows are imported for future use."""

    __tablename__ = "predictor_main_marks_estimates"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    session = Column(Integer, nullable=True)
    shift_label = Column(String(50), nullable=True)
    percentile_target = Column(Float, nullable=False)
    marks_low = Column(Float, nullable=False)
    marks_high = Column(Float, nullable=False)
    total_marks = Column(Integer, nullable=False)
    source_type = Column(String(40), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "year", "session", "shift_label", "percentile_target", "source_type",
            name="uq_predictor_main_marks_estimates_key",
        ),
    )


class PredictorMainCohortMetric(Base):
    __tablename__ = "predictor_main_cohort_metrics"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    metric = Column(String(100), nullable=False)
    category = Column(String(20), nullable=True)
    value = Column(Float, nullable=False)

    __table_args__ = (UniqueConstraint("year", "metric", "category", name="uq_predictor_main_cohort_metrics_key"),)


class PredictorAdvancedMarksRankAnchor(Base):
    __tablename__ = "predictor_advanced_marks_rank_anchors"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    rank_list = Column(String(20), nullable=False)
    rank = Column(Integer, nullable=False)
    marks = Column(Integer, nullable=False)
    total_marks = Column(Integer, nullable=False)
    pdf_page = Column(Integer, nullable=True)
    section = Column(String(20), nullable=True)

    __table_args__ = (
        UniqueConstraint("year", "rank_list", "rank", name="uq_predictor_advanced_marks_rank_key"),
    )


class PredictorAdvancedQualifyingCutoff(Base):
    __tablename__ = "predictor_advanced_qualifying_cutoffs"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    rank_list = Column(String(20), nullable=False)
    minimum_each_subject = Column(Integer, nullable=False)
    minimum_aggregate = Column(Integer, nullable=False)

    __table_args__ = (UniqueConstraint("year", "rank_list", name="uq_predictor_advanced_qualifying_key"),)


class PredictorNirfRanking(Base):
    __tablename__ = "predictor_nirf_rankings"

    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    nirf_id = Column(String(30), nullable=False)
    institute_id = Column(Integer, ForeignKey("predictor_institutes.id"), nullable=True)
    institute_name = Column(String(255), nullable=False)
    rank = Column(Integer, nullable=False)
    score = Column(Float, nullable=True)

    __table_args__ = (UniqueConstraint("year", "nirf_id", name="uq_predictor_nirf_rankings_key"),)

    institute = relationship("PredictorInstitute")


class PredictorAttemptPrediction(Base):
    """Persisted rank/percentile estimate for one test_attempts row. College matches are NOT
    persisted here — they're recomputed from predictor_josaa_cutoffs on every fetch so an old
    attempt's matches always reflect the newest imported cutoff data."""

    __tablename__ = "predictor_attempt_predictions"

    id = Column(Integer, primary_key=True)
    attempt_id = Column(Integer, ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    raw_score = Column(Float, nullable=False)
    raw_max_score = Column(Float, nullable=False)
    scaled_marks_300 = Column(Float, nullable=False)
    reference_year = Column(Integer, nullable=True)
    percentile_low = Column(Float, nullable=True)
    percentile_high = Column(Float, nullable=True)
    percentile_basis = Column(String(40), nullable=False)
    rank_low = Column(Integer, nullable=True)
    rank_high = Column(Integer, nullable=True)
    rank_basis = Column(String(40), nullable=False)
    confidence = Column(String(20), nullable=False)
    disclaimer = Column(Text, nullable=False)

    __table_args__ = (
        CheckConstraint(
            "confidence IN ('full_length_mock','partial_practice','insufficient_data')",
            name="ck_predictor_attempt_predictions_confidence",
        ),
    )

    attempt = relationship("TestAttempt")
    user = relationship("User")
