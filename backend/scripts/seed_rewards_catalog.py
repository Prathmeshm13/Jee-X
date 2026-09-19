"""CLI: get-or-create the reward catalog. Idempotent — safe to re-run.

Usage (from backend/):
    ./venv/Scripts/python.exe scripts/seed_rewards_catalog.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal
from app import models

CATALOG = [
    {
        "name": "Jee Edge T-Shirt",
        "description": "Redeem 500 Edge Coins for a Jee Edge t-shirt. We'll email you to confirm size and shipping.",
        "cost_coins": 500,
    },
]


def main():
    db = SessionLocal()
    try:
        added = 0
        for item in CATALOG:
            existing = db.query(models.RewardCatalogItem).filter(models.RewardCatalogItem.name == item["name"]).first()
            if existing:
                existing.description = item["description"]
                existing.cost_coins = item["cost_coins"]
                existing.is_active = True
                continue
            db.add(models.RewardCatalogItem(**item, is_active=True))
            added += 1
        db.commit()
    finally:
        db.close()

    print(f"Catalog items added: {added}")
    print(f"Catalog items updated: {len(CATALOG) - added}")


if __name__ == "__main__":
    main()
