"""CLI: import generated/questions/<subject>/*.json into the database.

Usage (from backend/):
    ./venv/Scripts/python.exe scripts/import_questions.py [path/to/questions/root]

Defaults to ../generated/questions relative to this file.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.importer import import_directory


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent.parent / "generated" / "questions"
    if not root.is_dir():
        print(f"Not a directory: {root}")
        sys.exit(1)

    db = SessionLocal()
    try:
        totals = import_directory(db, root)
    finally:
        db.close()

    print(f"Files processed: {totals['files']}")
    print(f"Questions added: {totals['added']}")
    print(f"Questions updated: {totals['updated']}")
    if totals["errors"]:
        print(f"Errors ({len(totals['errors'])}):")
        for e in totals["errors"]:
            print(f"  - {e}")
    else:
        print("Errors: none")


if __name__ == "__main__":
    main()
