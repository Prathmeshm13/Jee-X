"""CLI: import docs/JEE-Predictor-Data/jee-predictor-data/data/*.json into predictor_* tables.

Usage (from backend/):
    ./venv/Scripts/python.exe scripts/import_predictor_data.py [path/to/jee-predictor-data/data]

Defaults to ../docs/JEE-Predictor-Data/jee-predictor-data/data relative to this file. Re-running
is safe — every dataset is upserted by its documented natural key.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app.predictor_importer import import_all


def main():
    default_root = (
        Path(__file__).resolve().parent.parent.parent
        / "docs" / "JEE-Predictor-Data" / "jee-predictor-data" / "data"
    )
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else default_root
    if not root.is_dir():
        print(f"Not a directory: {root}")
        sys.exit(1)

    db = SessionLocal()
    try:
        totals = import_all(db, root)
    finally:
        db.close()

    print(f"Files imported: {totals['files']}")
    print(f"Rows added: {totals['added']}")
    print(f"Rows updated: {totals['updated']}")
    if totals["errors"]:
        print(f"Errors ({len(totals['errors'])}):")
        for e in totals["errors"]:
            print(f"  - {e}")
    else:
        print("Errors: none")


if __name__ == "__main__":
    main()
