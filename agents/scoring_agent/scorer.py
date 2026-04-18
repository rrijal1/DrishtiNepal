"""
Drishti Nepal — Scoring Agent (v1 — Outcome-Only Model)

The score is a single number (0–100) representing weighted progress toward
manifesto outcome targets. There are no composite tiers in the numeric score.

Formula:
    progress_i = (current_i - baseline_i) / (target_i - baseline_i)   [higher_is_better]
    progress_i = (baseline_i - current_i) / (baseline_i - target_i)   [lower_is_better]
    progress_i is clamped to [0.0, 1.0]

    minister_score = Σ(weight_i × progress_i) / Σ(weight_i) × 100

Minister attribution:
    Each indicator carries a `ministry` field (primary responsible portfolio)
    and optionally `metadata.ministries` (additional shared portfolios).
    A minister's score is the weighted average of all indicators for their portfolio.

Initiatives and evidence are displayed on the manifesto item pages but do NOT
contribute to the numeric score.
"""

from datetime import datetime, timezone, timedelta

from agents.common.db import db
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("scoring_agent")

METHODOLOGY_VERSION = "v1"


# ─────────────────────────────────────────────────────────────────────────────
# Core: indicator progress calculation
# ─────────────────────────────────────────────────────────────────────────────


def _indicator_progress(ind: dict) -> float | None:
    """
    Return progress fraction [0.0 → 1.0] for a single indicator, or None if
    values are missing or the gap to close is zero.
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
    else:  # lower_is_better (poverty, inflation, migration, pollution)
        needed = baseline - target
        achieved = baseline - current

    if needed == 0:
        # Already at or past target from baseline
        return 1.0 if achieved >= 0 else 0.0

    progress = achieved / needed
    return max(0.0, min(1.0, progress))


def _is_indicator_for_minister(ind: dict, portfolio_en: str) -> bool:
    """
    Return True if this indicator is attributed to the given portfolio.

    Matching rules (case-insensitive substring):
      1. Exact match: indicator.ministry == portfolio
      2. Portfolio contains indicator's ministry keyword
      3. Shared portfolios in metadata.ministries also checked
    """
    portfolio = portfolio_en.lower().strip()

    # Collect all ministries for this indicator
    primary = ind.get("ministry", "").lower().strip()
    meta = ind.get("metadata") or {}
    shared = [m.lower().strip() for m in meta.get("ministries", [])]
    all_ministries = [m for m in [primary] + shared if m]

    for ministry in all_ministries:
        if ministry == portfolio:
            return True
        if ministry in portfolio:
            return True
        if portfolio in ministry:
            return True

    return False


# ─────────────────────────────────────────────────────────────────────────────
# Minister score
# ─────────────────────────────────────────────────────────────────────────────


def calculate_minister_score(
    minister_id: str,
    all_indicators: list[dict],
    portfolio_en: str = "",
) -> dict:
    """
    Outcome-only score for a single minister.

    Returns:
        {
            "score": float | None,
            "indicator_count": int,
            "indicators": [...],        # per-indicator breakdown
            "reason": str,
        }
    """
    # Filter indicators to this minister's portfolio
    relevant = [
        ind for ind in all_indicators if _is_indicator_for_minister(ind, portfolio_en)
    ]

    if not relevant:
        return {
            "score": None,
            "indicator_count": 0,
            "indicators": [],
            "reason": f"no_indicators_for_portfolio:{portfolio_en}",
        }

    # Weighted average
    total_weight = 0.0
    weighted_sum = 0.0
    indicator_details = []

    for ind in relevant:
        progress = _indicator_progress(ind)
        weight = float(ind.get("weight") or 5)

        detail = {
            "indicator_name": ind["indicator_name"],
            "indicator_label": ind.get("indicator_label", ""),
            "priority_area": ind.get("priority_area", ""),
            "weight": weight,
            "baseline": ind.get("baseline_value"),
            "current": ind.get("current_value"),
            "target": ind.get("target_value"),
            "unit": ind.get("unit", ""),
            "direction": ind.get("direction", "higher_is_better"),
            "progress_pct": round(progress * 100, 2) if progress is not None else None,
            "source": ind.get("source", ""),
        }
        indicator_details.append(detail)

        if progress is not None:
            weighted_sum += progress * weight
            total_weight += weight

    if total_weight == 0:
        return {
            "score": None,
            "indicator_count": len(relevant),
            "indicators": indicator_details,
            "reason": "all_indicators_missing_data",
        }

    score = round(weighted_sum / total_weight * 100, 2)
    return {
        "score": score,
        "indicator_count": len(relevant),
        "indicators": indicator_details,
        "reason": "ok",
    }


# ─────────────────────────────────────────────────────────────────────────────
# National outcome score (for the national scorecard)
# ─────────────────────────────────────────────────────────────────────────────


def calculate_national_outcome_score(all_indicators: list[dict]) -> dict:
    """
    National outcome score = weighted average across ALL indicators.
    Also returns a per-karar-patra-area breakdown.
    """
    if not all_indicators:
        return {"score": None, "breakdown": {}, "indicator_count": 0}

    total_weight = 0.0
    weighted_sum = 0.0
    by_area: dict[str, dict] = {}

    for ind in all_indicators:
        progress = _indicator_progress(ind)
        if progress is None:
            continue

        weight = float(ind.get("weight") or 5)
        area = ind.get("priority_area", "unknown")

        if area not in by_area:
            by_area[area] = {"weighted_sum": 0.0, "total_weight": 0.0}

        by_area[area]["weighted_sum"] += progress * weight
        by_area[area]["total_weight"] += weight
        weighted_sum += progress * weight
        total_weight += weight

    area_scores: dict[str, float] = {}
    for area, vals in by_area.items():
        if vals["total_weight"] > 0:
            area_scores[area] = round(
                vals["weighted_sum"] / vals["total_weight"] * 100, 2
            )

    overall = round(weighted_sum / total_weight * 100, 2) if total_weight > 0 else None

    return {
        "score": overall,
        "breakdown": area_scores,
        "indicator_count": len(all_indicators),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Persistence
# ─────────────────────────────────────────────────────────────────────────────


def store_score(minister_id: str, outcome_score: float, breakdown: dict) -> None:
    """Store an outcome score snapshot. overall == outcome_score (v1 model)."""
    now = datetime.now(timezone.utc)
    period_end = now.date().isoformat()
    period_start = (now - timedelta(days=30)).date().isoformat()

    db.table("scores").insert(
        {
            "minister_id": minister_id,
            "period_start": period_start,
            "period_end": period_end,
            "outcome_score": outcome_score,
            "overall": outcome_score,  # v1: overall = outcome_score
            "breakdown": breakdown,
            "methodology_version": METHODOLOGY_VERSION,
        }
    ).execute()

    db.table("ministers").update({"overall_score": outcome_score}).eq(
        "id", minister_id
    ).execute()


# ─────────────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────────────


def run() -> None:
    """Score all active ministers and store snapshots."""
    run_id = log_agent_run("scoring_agent")
    items_processed = 0
    items_failed = 0

    try:
        # Fetch only result indicators — process indicators don't count toward scores
        all_indicators = (
            db.table("outcome_indicators")
            .select("*")
            .eq("indicator_type", "result")
            .execute()
            .data
        )
        logger.info(
            f"Loaded {len(all_indicators)} result indicators (process indicators excluded)"
        )

        # National score (logged but not stored in scores table — no minister_id)
        national = calculate_national_outcome_score(all_indicators)
        if national["score"] is not None:
            logger.info(
                f"National outcome score: {national['score']:.1f}/100 "
                f"({national['indicator_count']} indicators)"
            )
        for area in sorted(national["breakdown"].keys()):
            logger.info(f"  {area}: {national['breakdown'][area]:.1f}/100")

        # Score each active minister
        ministers = (
            db.table("ministers").select("*").eq("status", "active").execute().data
        )
        logger.info(
            f"Scoring {len(ministers)} active ministers (methodology {METHODOLOGY_VERSION})"
        )

        for minister in ministers:
            mid = minister["id"]
            name = minister["name_en"]
            portfolio = minister.get("portfolio_en", "")

            result = calculate_minister_score(mid, all_indicators, portfolio)

            if result["score"] is None:
                logger.warning(f"  SKIP {name} ({portfolio}): {result['reason']}")
                items_failed += 1
                continue

            breakdown = {
                "indicators": result["indicators"],
                "indicator_count": result["indicator_count"],
                "national_by_area": national["breakdown"],
                "methodology_version": METHODOLOGY_VERSION,
            }

            store_score(mid, result["score"], breakdown)
            items_processed += 1

            logger.info(
                f"  {name} ({portfolio}): "
                f"{result['score']:.1f}/100 "
                f"({result['indicator_count']} indicators)"
            )

        complete_agent_run(
            run_id, "success", items_processed + items_failed, items_processed
        )
        logger.info(
            f"Scoring complete: {items_processed} scored, {items_failed} skipped"
        )

    except Exception as e:
        logger.error(f"Scoring agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, 0, str(e))
        raise


if __name__ == "__main__":
    run()
