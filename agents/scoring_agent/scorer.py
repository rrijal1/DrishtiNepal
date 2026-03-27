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


def calculate_sentiment_score(minister_id: str, days: int = 30) -> float:
    """Aggregate sentiment from recent actions."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    actions = (
        db.table("actions")
        .select("sentiment")
        .eq("minister_id", minister_id)
        .gte("action_date", since)
        .execute()
    )
    if not actions.data:
        return 50.0

    sentiment_scores = {"positive": 80, "neutral": 50, "negative": 20, "mixed": 40}
    total = sum(sentiment_scores.get(a["sentiment"], 50) for a in actions.data)
    return total / len(actions.data)


def calculate_activity_score(minister_id: str, days: int = 30) -> float:
    """Score based on number and quality of actions taken."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    actions = (
        db.table("actions")
        .select("category, sentiment")
        .eq("minister_id", minister_id)
        .gte("action_date", since)
        .execute()
    )
    if not actions.data:
        return 30.0  # Low score for inactivity

    # More diverse, positive actions = higher score
    count = len(actions.data)
    categories = set(a["category"] for a in actions.data)
    diversity_bonus = min(len(categories) * 5, 20)

    base = min(count * 5, 60)  # Cap at 60 from count alone
    return min(100, base + diversity_bonus + 20)  # +20 baseline for being active


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
            "policy_effectiveness": dimensions["policy_effectiveness"],
            "transparency": dimensions["transparency"],
            "financial_prudence": dimensions["financial_prudence"],
            "public_sentiment": dimensions["public_sentiment"],
            "parliamentary_activity": dimensions["parliamentary_activity"],
            "overall": overall,
            "breakdown": dimensions,
            "methodology_version": "v1",
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
                "policy_effectiveness": 50.0,  # TODO: needs gazette/outcome data
                "transparency": 50.0,  # TODO: needs RTI/communication data
                "financial_prudence": 50.0,  # TODO: needs budget data
                "public_sentiment": calculate_sentiment_score(mid),
                "parliamentary_activity": calculate_activity_score(mid),
            }

            overall = compute_overall_score(dimensions)
            store_score(mid, dimensions, overall)
            items_processed += 1

            logger.info(
                f"  {name}: {overall}/100 (manifesto: {dimensions['manifesto_compliance']:.0f}, sentiment: {dimensions['public_sentiment']:.0f})"
            )

        complete_agent_run(run_id, "success", items_processed, items_processed)
        logger.info(f"Scoring complete for {items_processed} ministers")

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, 0, str(e))
        raise


if __name__ == "__main__":
    run()
