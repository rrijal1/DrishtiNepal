"""
Drishti Nepal — Seed Script
Load structured JSON data into Supabase.
Run after applying migration 002.

Usage:
    python -m agents.seed          # seed everything
    python -m agents.seed ministers # seed ministers only
    python -m agents.seed manifesto
    python -m agents.seed agendas
"""

import json
import sys
from datetime import date, timedelta
from pathlib import Path

from agents.common.db import db
from agents.common.utils import setup_logger

logger = setup_logger("seed")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DECISION_DATE = date(2026, 3, 27)  # First cabinet meeting


def load_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ------------------------------------------------------------------
# Ministers
# ------------------------------------------------------------------
def seed_ministers():
    cabinet = load_json(DATA_DIR / "ministers" / "cabinet_2026.json")
    rows = []
    for m in cabinet["ministers"]:
        rows.append(
            {
                "name_en": m["name_en"],
                "name_np": m["name_np"],
                "portfolio_en": m["portfolio_en"],
                "portfolio_np": m["portfolio_np"],
                "party": m["party"],
                "appointed_date": m["appointed_date"],
                "photo_url": m.get("photo_url"),
                "bio_summary_en": m.get("bio_summary_en") or None,
                "bio_summary_np": m.get("bio_summary_np") or None,
                "previous_roles": m.get("previous_roles", []),
                "status": "active",
            }
        )

    result = db.table("ministers").upsert(rows, on_conflict="name_en").execute()
    logger.info(f"Seeded {len(result.data)} ministers")
    return result.data


# ------------------------------------------------------------------
# Manifesto Items — Bachha Patra (100 foundations)
# ------------------------------------------------------------------
def seed_bachha_patra():
    bp = load_json(DATA_DIR / "manifesto" / "bachha_patra.json")
    rows = []
    for f in bp["foundations"]:
        rows.append(
            {
                "source_id": f["id"],
                "document_type": "bachha_patra",
                "category": f["category"],
                "title_en": f["title_en"],
                "item_text_en": f["title_en"],
                "item_text_np": f.get("title_np", f["title_en"]),
                "key_commitments": f.get("key_commitments", []),
                "measurable": f.get("measurable", False),
                "target_metrics": f.get("target_metrics"),
                "priority": f.get("priority", "medium"),
                "status": "not_started",
                "metadata": {
                    "number": f["number"],
                    "note": f.get("note"),
                },
            }
        )

    result = db.table("manifesto_items").upsert(rows, on_conflict="source_id").execute()
    logger.info(f"Seeded {len(result.data)} bachha patra foundations")
    return result.data


# ------------------------------------------------------------------
# Manifesto Items — Karar Patra (5 priority areas)
# ------------------------------------------------------------------
def seed_karar_patra():
    kp = load_json(DATA_DIR / "manifesto" / "karar_patra.json")
    rows = []
    for pa in kp["priority_areas"]:
        rows.append(
            {
                "source_id": pa["id"],
                "document_type": "karar_patra",
                "category": pa["category"],
                "title_en": pa["title_en"],
                "title_np": pa.get("title_np"),
                "item_text_en": pa.get("goal_en", pa["title_en"]),
                "item_text_np": pa.get("goal_np", pa.get("title_np", pa["title_en"])),
                "current_situation_en": pa.get("current_situation_en"),
                "current_situation_np": pa.get("current_situation_np"),
                "goal_en": pa.get("goal_en"),
                "goal_np": pa.get("goal_np"),
                "key_targets": pa.get("key_targets", []),
                "bachha_patra_links": pa.get("bachha_patra_links", []),
                "measurable": pa.get("measurable", False),
                "priority": "high",
                "status": "not_started",
                "metadata": {"number": pa["number"]},
            }
        )

    result = db.table("manifesto_items").upsert(rows, on_conflict="source_id").execute()
    logger.info(f"Seeded {len(result.data)} karar patra priority areas")
    return result.data


# ------------------------------------------------------------------
# Governance Agendas (100 items)
# ------------------------------------------------------------------
DEADLINE_DAYS = {
    "immediate": 0,
    "7 days": 7,
    "15 days": 15,
    "30 days": 30,
    "60 days": 60,
    "90 days": 90,
    "100 days": 100,
}


def parse_deadline_date(raw: str | None) -> str | None:
    if not raw:
        return None
    raw_lower = raw.strip().lower()
    if raw_lower in DEADLINE_DAYS:
        return (DECISION_DATE + timedelta(days=DEADLINE_DAYS[raw_lower])).isoformat()
    # Try to extract number of days
    for suffix in (" days", " day"):
        if raw_lower.endswith(suffix):
            try:
                n = int(raw_lower.replace(suffix, "").strip())
                return (DECISION_DATE + timedelta(days=n)).isoformat()
            except ValueError:
                pass
    return None


def seed_agendas():
    ag = load_json(DATA_DIR / "government" / "100_agendas.json")
    rows = []
    for a in ag["agendas"]:
        rows.append(
            {
                "source_id": a["id"],
                "number": a["number"],
                "section": a["section"],
                "category": a["category"],
                "title_en": a["title_en"],
                "summary_en": a.get("summary_en"),
                "deadline": a.get("deadline"),
                "deadline_date": parse_deadline_date(a.get("deadline")),
                "significance": a.get("significance", "medium"),
                "status": a.get("status", "announced"),
                "manifesto_links": a.get("manifesto_links", []),
            }
        )

    result = (
        db.table("governance_agendas").upsert(rows, on_conflict="source_id").execute()
    )
    logger.info(f"Seeded {len(result.data)} governance agendas")
    return result.data


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------
SEEDERS = {
    "ministers": seed_ministers,
    "manifesto": lambda: (seed_bachha_patra(), seed_karar_patra()),
    "agendas": seed_agendas,
}


def run():
    targets = sys.argv[1:] if len(sys.argv) > 1 else list(SEEDERS.keys())
    for target in targets:
        if target not in SEEDERS:
            logger.error(
                f"Unknown seed target: {target}. Options: {list(SEEDERS.keys())}"
            )
            sys.exit(1)
        logger.info(f"Seeding: {target}")
        SEEDERS[target]()
    logger.info("Seed complete")


if __name__ == "__main__":
    run()
