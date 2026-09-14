import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. This app requires a MySQL connection "
        "(e.g. mysql+pymysql://user:pass@host:port/dbname) — set it in backend/.env."
    )
if not DATABASE_URL.startswith("mysql"):
    raise RuntimeError(
        f"Unsupported DATABASE_URL scheme: {DATABASE_URL.split(':', 1)[0]!r}. "
        "Only MySQL (mysql+pymysql://...) is supported."
    )

connect_args = {}
ssl_ca = os.getenv("DB_SSL_CA")
if ssl_ca:
    connect_args = {"ssl": {"ca": ssl_ca}}

engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True, pool_recycle=280)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
