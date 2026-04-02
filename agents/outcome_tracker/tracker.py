"""
Drishti Nepal — Outcome Tracker Agent
Pulls latest values for outcome indicators from authoritative sources.

Schedule: Weekly (via cron)
Sources: World Bank API, NRB, CBS, TI, NEA, DoR, NTA

For now, this agent supports the World Bank Open Data API.
Other sources will be added incrementally as their APIs/reports become available.
Manual updates can be done via the Supabase dashboard or seed script.
"""

import re
from datetime import datetime, timezone

import httpx

from agents.common.db import db
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("outcome_tracker")

# World Bank indicator mapping: indicator_name -> WB indicator code
WORLD_BANK_INDICATORS = {
    "gdp_per_capita": "NY.GDP.PCAP.CD",
    "gdp_total": "NY.GDP.MKTP.CD",
    "gdp_growth_rate": "NY.GDP.MKTP.KD.ZG",
    "poverty_headcount": "SI.POV.NAHC",
    "unemployment_rate": "SL.UEM.TOTL.NE.ZS",
    "remittance_gdp_ratio": "BX.TRF.PWKR.DT.GD.ZS",
    "financial_inclusion": "FX.OWN.TOTL.ZS",
}

WORLD_BANK_API = "https://api.worldbank.org/v2/country/NPL/indicator/{code}?format=json&per_page=5&date=2020:2026"


def fetch_world_bank(indicator_code: str) -> tuple[float | None, str | None]:
    """Fetch latest available value from World Bank API. Returns (value, year)."""
    url = WORLD_BANK_API.format(code=indicator_code)
    try:
        resp = httpx.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if len(data) < 2 or not data[1]:
            return None, None
        # data[1] is sorted most recent first
        for entry in data[1]:
            if entry.get("value") is not None:
                return entry["value"], entry["date"]
        return None, None
    except Exception as e:
        logger.warning(f"World Bank API error for {indicator_code}: {e}")
        return None, None


def update_indicator(
    indicator_name: str, value: float, measured_date: str, source_note: str = None
):
    """Update an indicator's current value in the database."""
    update = {
        "current_value": value,
        "measured_date": measured_date,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if source_note:
        update["metadata"] = {"last_update_note": source_note}

    db.table("outcome_indicators").update(update).eq(
        "indicator_name", indicator_name
    ).execute()
    logger.info(f"  Updated {indicator_name}: {value} (as of {measured_date})")


def pull_world_bank_data() -> int:
    """Pull latest data from World Bank for mapped indicators."""
    updated = 0
    for indicator_name, wb_code in WORLD_BANK_INDICATORS.items():
        value, year = fetch_world_bank(wb_code)
        if value is not None and year is not None:
            # World Bank returns yearly data; use Jan 1 of that year
            measured = f"{year}-01-01"

            # For gdp_total, convert to billions
            if indicator_name == "gdp_total" and value > 1e6:
                value = round(value / 1e9, 2)

            update_indicator(
                indicator_name,
                round(value, 2),
                measured,
                f"World Bank API ({wb_code}), year {year}",
            )
            updated += 1
        else:
            logger.info(f"  No new data for {indicator_name} ({wb_code})")
    return updated


def compute_progress_summary() -> dict:
    """Compute overall progress summary across all indicators."""
    result = db.table("outcome_indicators").select("*").execute()
    indicators = result.data

    total = len(indicators)
    on_track = 0
    behind = 0
    no_data = 0

    for ind in indicators:
        baseline = ind.get("baseline_value")
        current = ind.get("current_value")
        target = ind.get("target_value")

        if baseline is None or current is None or target is None:
            no_data += 1
            continue

        direction = ind.get("direction", "higher_is_better")
        if direction == "higher_is_better":
            needed = target - baseline
            achieved = current - baseline
        else:
            needed = baseline - target
            achieved = baseline - current

        # Simple check: is progress >= expected linear pace?
        # (For now, any positive movement counts as "on track" since it's early)
        if needed == 0 or achieved >= 0:
            on_track += 1
        else:
            behind += 1

    return {
        "total_indicators": total,
        "on_track": on_track,
        "behind": behind,
        "no_data": no_data,
    }


def run():
    """Main entry point for the outcome tracker agent."""
    run_id = log_agent_run("outcome_tracker")
    items_updated = 0

    try:
        logger.info("Starting outcome indicator update...")

        # Pull from World Bank
        items_updated += pull_world_bank_data()

        # Log summary
        summary = compute_progress_summary()
        logger.info(
            f"Progress summary: {summary['on_track']}/{summary['total_indicators']} on track, "
            f"{summary['behind']} behind, {summary['no_data']} no data"
        )

        complete_agent_run(run_id, "success", len(WORLD_BANK_INDICATORS), items_updated)
        logger.info(f"Outcome tracker complete. Updated {items_updated} indicators.")

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", 0, 0, str(e))
        raise


if __name__ == "__main__":
    run()
