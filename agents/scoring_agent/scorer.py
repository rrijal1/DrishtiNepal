"""
Drishti Nepal — Scoring Agent (v3 — Three-Tier Model)
Daily recalculation of minister and national scores.

Tier 1 — Outcome Score: Are real-world indicators moving toward manifesto targets?
Tier 2 — Initiative Score: How many manifesto items are being acted on?
Tier 3 — Evidence Score: Does evidence suggest initiatives will produce results?

The composite overall score uses configurable weights from SCORING_WEIGHTS.
"""

from datetime import datetime, timezone, timedelta

from agents.common.db import db
from agents.common.config import SCORING_WEIGHTS
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("scoring_agent")

METHODOLOGY_VERSION = "v3"


# ─────────────────────────────────────────────────────────────────
# Tier 1: Outcome Score
# ─────────────────────────────────────────────────────────────────


def calculate_outcome_score_national() -> dict:
    """
    Calculate the national outcome score by measuring progress toward
    manifesto targets across all outcome indicators.

    Returns a dict with overall score and per-priority-area breakdown.
    """
    result = db.table("outcome_indicators").select("*").execute()
    indicators = result.data

    if not indicators:
        return {"score": 50.0, "breakdown": {}, "indicator_count": 0}

    # Group by priority area
    by_area: dict[str, list] = {}
    for ind in indicators:
        area = ind.get("priority_area", "unknown")
        by_area.setdefault(area, []).append(ind)

    # Weight by manifesto structure (pp-002 covers 42% of items, pp-005 covers 5%)
    area_weights = {
        "pp-001": 0.18,  # 18 bachha patra items
        "pp-002": 0.42,  # 42 items
        "pp-003": 0.20,  # 20 items
        "pp-004": 0.15,  # 15 items
        "pp-005": 0.05,  # 5 items
    }

    area_scores = {}
    weighted_total = 0.0
    weight_sum = 0.0

    for area, inds in by_area.items():
        area_progress = []
        for ind in inds:
            progress = _indicator_progress(ind)
            if progress is not None:
                area_progress.append(progress)

        if area_progress:
            area_score = sum(area_progress) / len(area_progress) * 100
            area_score = max(0, min(100, area_score))
        else:
            area_score = 50.0  # No data yet

        area_scores[area] = round(area_score, 2)
        weight = area_weights.get(area, 0.10)
        weighted_total += area_score * weight
        weight_sum += weight

    overall = round(weighted_total / weight_sum, 2) if weight_sum > 0 else 50.0

    return {
        "score": overall,
        "breakdown": area_scores,
        "indicator_count": len(indicators),
    }


def _indicator_progress(ind: dict) -> float | None:
    """
    Calculate progress fraction (0.0 to 1.0) for a single indicator.
    Returns None if data is insufficient.
    """
    baseline = ind.get("baseline_value")
    current = ind.get("current_value")
    target = ind.get("target_value")

    if baseline is None or current is None or target is None:
        return None

    direction = ind.get("direction", "higher_is_better")

    if direction == "higher_is_better":
        needed = target - baseline
        achieved = current - baseline
    else:
        needed = baseline - target
        achieved = baseline - current

    if needed == 0:
        return 1.0 if achieved >= 0 else 0.0

    progress = achieved / needed
    return max(0.0, min(1.0, progress))


def calculate_outcome_score_minister(minister_id: str) -> float:
    """
    Calculate a minister-level outcome score based on the indicators
    linked to manifesto items assigned to that minister.
    Falls back to national score if no specific assignments.
    """
    # Get manifesto items assigned to this minister
    assignments = (
        db.table("minister_manifesto_assignments")
        .select("manifesto_item_id, manifesto_items(source_id)")
        .eq("minister_id", minister_id)
        .execute()
    )
    if not assignments.data:
        return 50.0  # Default — no assignments yet

    # Get the source_ids for assigned items
    assigned_source_ids = set()
    for a in assignments.data:
        mi = a.get("manifesto_items")
        if mi and mi.get("source_id"):
            assigned_source_ids.add(mi["source_id"])

    # Get indicators linked to those items or their priority areas
    all_indicators = db.table("outcome_indicators").select("*").execute()

    relevant = [
        ind
        for ind in all_indicators.data
        if ind.get("priority_area") in assigned_source_ids
        or (
            ind.get("manifesto_item_id")
            and any(
                a["manifesto_item_id"] == ind["manifesto_item_id"]
                for a in assignments.data
            )
        )
    ]

    if not relevant:
        return 50.0

    progresses = [_indicator_progress(ind) for ind in relevant]
    progresses = [p for p in progresses if p is not None]

    if not progresses:
        return 50.0

    return round(sum(progresses) / len(progresses) * 100, 2)


# ─────────────────────────────────────────────────────────────────
# Tier 2: Initiative Score
# ─────────────────────────────────────────────────────────────────

STATUS_SCORE_MAP = {
    "fulfilled": 1.0,
    "partially_fulfilled": 0.6,
    "in_progress": 0.3,
    "not_started": 0.0,
    "broken": -0.3,
    "irrelevant": None,  # Excluded from calculation
}


def calculate_initiative_score(minister_id: str) -> dict:
    """
    Calculate initiative score for a minister based on manifesto item statuses.
    Returns score and status counts.
    """
    assignments = (
        db.table("minister_manifesto_assignments")
        .select("manifesto_item_id")
        .eq("minister_id", minister_id)
        .execute()
    )
    if not assignments.data:
        return {"score": 50.0, "counts": {}, "total": 0}

    item_ids = [a["manifesto_item_id"] for a in assignments.data]
    items = db.table("manifesto_items").select("status").in_("id", item_ids).execute()

    if not items.data:
        return {"score": 50.0, "counts": {}, "total": 0}

    counts = {}
    scores = []
    for item in items.data:
        status = item["status"]
        counts[status] = counts.get(status, 0) + 1
        score_val = STATUS_SCORE_MAP.get(status)
        if score_val is not None:
            scores.append(score_val)

    if not scores:
        return {"score": 50.0, "counts": counts, "total": len(items.data)}

    raw = sum(scores) / len(scores)
    score = round(max(0, min(100, raw * 100)), 2)

    return {"score": score, "counts": counts, "total": len(items.data)}


# ─────────────────────────────────────────────────────────────────
# Tier 3: Evidence Score
# ─────────────────────────────────────────────────────────────────


def calculate_evidence_score(minister_id: str) -> dict:
    """
    Calculate evidence score from approved initiative_evidence assessments
    linked to the minister's assigned manifesto items.
    """
    assignments = (
        db.table("minister_manifesto_assignments")
        .select("manifesto_item_id")
        .eq("minister_id", minister_id)
        .execute()
    )
    if not assignments.data:
        return {"score": 50.0, "assessed": 0, "total": 0}

    item_ids = [a["manifesto_item_id"] for a in assignments.data]

    evidence = (
        db.table("initiative_evidence")
        .select("probability, status")
        .in_("manifesto_item_id", item_ids)
        .in_("status", ["approved", "under_review"])
        .execute()
    )

    if not evidence.data:
        return {"score": 50.0, "assessed": 0, "total": len(item_ids)}

    probabilities = [
        e["probability"] for e in evidence.data if e["probability"] is not None
    ]

    if not probabilities:
        return {"score": 50.0, "assessed": 0, "total": len(item_ids)}

    avg_prob = sum(probabilities) / len(probabilities)
    score = round(avg_prob * 100, 2)

    return {"score": score, "assessed": len(probabilities), "total": len(item_ids)}


# ─────────────────────────────────────────────────────────────────
# Composite Score
# ─────────────────────────────────────────────────────────────────


def compute_overall(tier_scores: dict) -> float:
    """Weighted average of all three tiers."""
    total = 0.0
    for key, weight in SCORING_WEIGHTS.items():
        total += tier_scores.get(key, 50.0) * weight
    return round(total, 2)


def store_score(minister_id: str, tier_scores: dict, breakdown: dict, overall: float):
    """Store a score snapshot with all three tiers."""
    now = datetime.now(timezone.utc)
    period_end = now.date().isoformat()
    period_start = (now - timedelta(days=30)).date().isoformat()

    db.table("scores").insert(
        {
            "minister_id": minister_id,
            "period_start": period_start,
            "period_end": period_end,
            "outcome_score": tier_scores["outcome_score"],
            "initiative_score": tier_scores["initiative_score"],
            "evidence_score": tier_scores["evidence_score"],
            "overall": overall,
            "breakdown": breakdown,
            "methodology_version": METHODOLOGY_VERSION,
        }
    ).execute()

    # Update minister's overall score
    db.table("ministers").update({"overall_score": overall}).eq(
        "id", minister_id
    ).execute()


# ─────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────


def run():
    """Main entry point for the scoring agent."""
    run_id = log_agent_run("scoring_agent")
    items_processed = 0

    try:
        # First, compute the national outcome score (shared context)
        national_outcome = calculate_outcome_score_national()
        logger.info(
            f"National Outcome Score: {national_outcome['score']}/100 "
            f"({national_outcome['indicator_count']} indicators)"
        )
        for area, score in national_outcome["breakdown"].items():
            logger.info(f"  {area}: {score}/100")

        # Score each minister
        ministers_result = (
            db.table("ministers").select("*").eq("status", "active").execute()
        )
        ministers = ministers_result.data
        logger.info(f"Scoring {len(ministers)} active ministers (v3 — 3-tier model)")

        for minister in ministers:
            mid = minister["id"]
            name = minister["name_en"]

            # Tier 1 — Outcome
            outcome = calculate_outcome_score_minister(mid)

            # Tier 2 — Initiative
            initiative = calculate_initiative_score(mid)

            # Tier 3 — Evidence
            evidence = calculate_evidence_score(mid)

            tier_scores = {
                "outcome_score": outcome,
                "initiative_score": initiative["score"],
                "evidence_score": evidence["score"],
            }

            overall = compute_overall(tier_scores)

            breakdown = {
                "outcome": {
                    "score": outcome,
                    "note": "Based on outcome indicators for assigned manifesto areas",
                },
                "initiative": {
                    "score": initiative["score"],
                    "counts": initiative["counts"],
                    "total": initiative["total"],
                },
                "evidence": {
                    "score": evidence["score"],
                    "assessed": evidence["assessed"],
                    "total": evidence["total"],
                },
                "national_outcome": national_outcome["breakdown"],
            }

            store_score(mid, tier_scores, breakdown, overall)
            items_processed += 1

            logger.info(
                f"  {name}: {overall}/100 "
                f"(outcome: {outcome:.0f}, initiative: {initiative['score']:.0f}, "
                f"evidence: {evidence['score']:.0f})"
            )

        complete_agent_run(run_id, "success", items_processed, items_processed)
        logger.info(f"Scoring complete for {items_processed} ministers")

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, 0, str(e))
        raise


if __name__ == "__main__":
    run()
