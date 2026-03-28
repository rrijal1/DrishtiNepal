"""
Drishti Nepal - Scoring Agent
Daily recalculation of minister performance scores.
"""

import json
from datetime import datetime, timezone, timedelta

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.config import SCORING_WEIGHTS
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("scoring_agent")


def get_active_ministers() -> list[dict]:
    result = db.table("ministers").select("*").eq("status", "active").execute()
    return result.data


def calculate_manifesto_compliance(minister_id: str) -> float:
    """Score based on fulfilled vs total assigned manifesto items."""
    assignments = (
        db.table("minister_manifesto_assignments")
        .select("manifesto_item_id")
        .eq("minister_id", minister_id)
        .execute()
    )
    if not assignments.data:
        return 50.0  # Default if no assignments yet

    item_ids = [a["manifesto_item_id"] for a in assignments.data]
    items = db.table("manifesto_items").select("status").in_("id", item_ids).execute()

    total = len(items.data)
    if total == 0:
        return 50.0

    score_map = {
        "fulfilled": 1.0,
        "partially_fulfilled": 0.6,
        "in_progress": 0.3,
        "not_started": 0.0,
        "broken": -0.5,
    }

    score_sum = sum(score_map.get(item["status"], 0) for item in items.data)
    return max(0, min(100, (score_sum / total) * 100))


def calculate_public_accountability(minister_id: str, days: int = 30) -> float:
    """
    30% dimension — captures what the manifesto cannot:
      - Media sentiment (50% of this sub-score): tone of news coverage
      - Transparency (30%): press conferences, public statements, RTI responses
      - Parliamentary engagement (20%): Q&A sessions, bills, committee activity
    All three are derived from scraped actions data until richer sources are available.
    """
    since = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    actions = (
        db.table("actions")
        .select("sentiment, category")
        .eq("minister_id", minister_id)
        .gte("action_date", since)
        .execute()
    )
    if not actions.data:
        return 50.0

    # Media sentiment sub-score
    sentiment_map = {"positive": 80, "neutral": 50, "negative": 20, "mixed": 40}
    sentiment_score = sum(
        sentiment_map.get(a["sentiment"], 50) for a in actions.data
    ) / len(actions.data)

    # Transparency sub-score: presence of press/communication actions
    # These categories must match the CHECK constraint in actions.category
    transparency_categories = {
        "press_conference",
        "statement",
        "rti_response",
        "announcement",
    }
    transparency_count = sum(
        1 for a in actions.data if a.get("category") in transparency_categories
    )
    transparency_score = min(100, 50 + transparency_count * 10)

    # Parliamentary engagement sub-score: presence of legislative actions
    parliament_categories = {
        "parliament",
        "bill",
        "committee",
        "qa_session",
        "legislation",
    }
    parliament_count = sum(
        1 for a in actions.data if a.get("category") in parliament_categories
    )
    parliament_score = min(100, 30 + parliament_count * 10)

    return round(
        sentiment_score * 0.50 + transparency_score * 0.30 + parliament_score * 0.20, 2
    )


def compute_overall_score(dimensions: dict) -> float:
    """Weighted average of all dimensions."""
    total = 0
    for key, weight in SCORING_WEIGHTS.items():
        total += dimensions.get(key, 50) * weight
    return round(total, 2)


def store_score(minister_id: str, dimensions: dict, overall: float):
    """Store a score snapshot."""
    now = datetime.now(timezone.utc)
    period_end = now.date().isoformat()
    period_start = (now - timedelta(days=30)).date().isoformat()

    db.table("scores").insert(
        {
            "minister_id": minister_id,
            "period_start": period_start,
            "period_end": period_end,
            "manifesto_compliance": dimensions["manifesto_compliance"],
            "public_accountability": dimensions["public_accountability"],
            "overall": overall,
            "breakdown": dimensions,
            "methodology_version": "v2",
        }
    ).execute()

    # Update minister's overall score
    db.table("ministers").update({"overall_score": overall}).eq(
        "id", minister_id
    ).execute()


def run():
    """Main entry point for the scoring agent."""
    run_id = log_agent_run("scoring_agent")
    items_processed = 0

    try:
        ministers = get_active_ministers()
        logger.info(f"Scoring {len(ministers)} active ministers")

        for minister in ministers:
            mid = minister["id"]
            name = minister["name_en"]

            dimensions = {
                "manifesto_compliance": calculate_manifesto_compliance(mid),
                "public_accountability": calculate_public_accountability(mid),
            }

            overall = compute_overall_score(dimensions)
            store_score(mid, dimensions, overall)
            items_processed += 1

            logger.info(
                f"  {name}: {overall}/100 (manifesto: {dimensions['manifesto_compliance']:.0f}, accountability: {dimensions['public_accountability']:.0f})"
            )

        complete_agent_run(run_id, "success", items_processed, items_processed)
        logger.info(f"Scoring complete for {items_processed} ministers")

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, 0, str(e))
        raise


if __name__ == "__main__":
    run()
