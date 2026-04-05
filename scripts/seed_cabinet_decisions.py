"""
Seed cabinet decisions from the 100 governance agendas into the
cabinet_decisions and cabinet_decision_manifesto_links tables.

Each agenda item becomes one cabinet_decision record. Items with
manifesto_links get corresponding cabinet_decision_manifesto_links rows.

Usage:
    python scripts/seed_cabinet_decisions.py
    python scripts/seed_cabinet_decisions.py --dry-run
"""

import json
import sys
from pathlib import Path

# Allow running from repo root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.common.db import db
from agents.common.utils import setup_logger

logger = setup_logger("seed_cabinet_decisions")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DECISION_DATE = "2026-03-27"
SOURCE_URL = "https://kathmandupost.com/national/2026/03/28/government-releases-100-point-agenda"


def load_agendas() -> list:
    path = DATA_DIR / "government" / "100_agendas.json"
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    return doc["agendas"]


def fetch_manifesto_id_map() -> dict:
    """Return {source_id: uuid} for all manifesto items."""
    rows = db.table("manifesto_items").select("id, source_id").execute().data
    return {r["source_id"]: r["id"] for r in (rows or [])}


SIGNIFICANCE_OVERRIDE = {
    "critical": "critical",
    "high": "high",
    "medium": "medium",
    "low": "low",
}

SECTION_TITLES = {
    "A": "Shared Commitment, Coordination, and Public Trust",
    "B": "Economic Governance and Fiscal Discipline",
    "C": "Service Delivery and Administrative Reform",
    "D": "Rule of Law and Anti-Corruption",
    "E": "Infrastructure and Investment",
    "F": "Social Sector and Human Development",
    "G": "Foreign Policy and Diaspora",
    "H": "Environment and Disaster Management",
    "I": "Agriculture and Food Security",
    "J": "Federalism and Local Governance",
}


def seed(dry_run: bool = False):
    agendas = load_agendas()
    manifesto_map = fetch_manifesto_id_map()
    logger.info(f"Loaded {len(agendas)} agendas, {len(manifesto_map)} manifesto items")

    inserted_decisions = 0
    inserted_links = 0
    skipped = 0

    for ag in agendas:
        ag_id = ag["id"]  # e.g. ga-001
        manifesto_links = ag.get("manifesto_links", [])

        # Check if a decision with this source_id already exists (via metadata)
        existing = (
            db.table("cabinet_decisions")
            .select("id")
            .eq("metadata->>agenda_id", ag_id)
            .execute()
            .data
        )
        if existing:
            skipped += 1
            continue

        title_en = ag["title_en"]
        summary_en = ag.get("summary_en") or title_en
        significance = SIGNIFICANCE_OVERRIDE.get(ag.get("significance", "medium"), "medium")
        section = ag.get("section", "")
        category = ag.get("category", "governance")

        decision_row = {
            "decision_date": DECISION_DATE,
            "title_en": title_en,
            "title_np": None,
            "summary_en": summary_en,
            "summary_np": None,
            "source_url": SOURCE_URL,
            "category": category,
            "significance": significance,
            "metadata": {
                "agenda_id": ag_id,
                "agenda_number": ag.get("number"),
                "section": section,
                "section_title": SECTION_TITLES.get(section, ""),
                "deadline": ag.get("deadline"),
                "status": ag.get("status", "announced"),
            },
        }

        if dry_run:
            logger.info(f"[DRY RUN] Would insert decision: {ag_id} — {title_en[:60]}")
            logger.info(f"  manifesto_links: {manifesto_links}")
            inserted_decisions += 1
            inserted_links += len(manifesto_links)
            continue

        result = db.table("cabinet_decisions").insert(decision_row).execute()
        decision_id = result.data[0]["id"]
        inserted_decisions += 1

        for bp_id in manifesto_links:
            manifesto_uuid = manifesto_map.get(bp_id)
            if not manifesto_uuid:
                logger.warning(f"  Manifesto item not found: {bp_id} (agenda {ag_id})")
                continue

            # Upsert to avoid duplicate key errors on re-run
            db.table("cabinet_decision_manifesto_links").upsert(
                {
                    "decision_id": decision_id,
                    "manifesto_item_id": manifesto_uuid,
                },
                on_conflict="decision_id,manifesto_item_id",
            ).execute()
            inserted_links += 1
            logger.info(f"  Linked {ag_id} → {bp_id}")

        logger.info(f"Inserted decision {ag_id}: {title_en[:60]}...")

    logger.info(
        f"\nDone. Inserted: {inserted_decisions} decisions, "
        f"{inserted_links} manifesto links, {skipped} skipped (already exist)."
    )


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    if dry_run:
        logger.info("=== DRY RUN MODE — no DB writes ===")
    seed(dry_run=dry_run)
