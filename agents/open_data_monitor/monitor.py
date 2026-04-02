"""
Drishti Nepal — Open Data Monitor Agent
Pulls structured government datasets from Open Nepal and other open data portals.

Schedule: Daily
Sources: opennepal.net (primary), CBS datasets, National Data Exchange (when live)

Updates outcome_indicators table with fresh data and creates gazette-style records
for significant data releases.
"""

import re
import json
from datetime import datetime, timezone

import httpx

from agents.common.db import db
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("open_data_monitor")

HEADERS = {"User-Agent": "DrishtiNepal/1.0 (https://drishtinepal.com)"}
HTTP_TIMEOUT = 30

# Open Nepal CKAN API
OPEN_NEPAL_API = "https://opennepal.net/api/3/action"

# Datasets we track — mapped to our outcome indicators
TRACKED_DATASETS = [
    {
        "name": "nepal-gdp",
        "search_query": "GDP Nepal",
        "indicator_names": ["gdp_per_capita", "gdp_total", "gdp_growth_rate"],
    },
    {
        "name": "poverty-nepal",
        "search_query": "poverty rate Nepal headcount",
        "indicator_names": ["poverty_headcount"],
    },
    {
        "name": "employment-nepal",
        "search_query": "employment unemployment Nepal",
        "indicator_names": ["unemployment_rate", "formal_jobs_created"],
    },
    {
        "name": "health-insurance",
        "search_query": "health insurance coverage Nepal",
        "indicator_names": ["health_insurance_coverage"],
    },
    {
        "name": "electricity-nepal",
        "search_query": "electricity installed capacity Nepal MW",
        "indicator_names": ["installed_electricity_mw"],
    },
    {
        "name": "internet-nepal",
        "search_query": "internet penetration broadband Nepal",
        "indicator_names": ["internet_penetration"],
    },
    {
        "name": "remittance-nepal",
        "search_query": "remittance Nepal",
        "indicator_names": ["remittance_gdp_ratio"],
    },
    {
        "name": "corruption-nepal",
        "search_query": "corruption transparency CPI Nepal",
        "indicator_names": ["ti_cpi_score"],
    },
    {
        "name": "highway-nepal",
        "search_query": "highway road km Nepal infrastructure",
        "indicator_names": ["highway_km"],
    },
]


def search_datasets(query: str, limit: int = 5) -> list[dict]:
    """Search Open Nepal CKAN portal for datasets."""
    url = f"{OPEN_NEPAL_API}/package_search"
    try:
        resp = httpx.get(
            url,
            params={"q": query, "rows": limit, "sort": "metadata_modified desc"},
            headers=HEADERS,
            timeout=HTTP_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("success"):
            return data.get("result", {}).get("results", [])
    except Exception as e:
        logger.warning(f"Open Nepal search failed for '{query}': {e}")
    return []


def fetch_dataset_resources(dataset_id: str) -> list[dict]:
    """Fetch resources (CSV, API links) for a dataset."""
    url = f"{OPEN_NEPAL_API}/package_show"
    try:
        resp = httpx.get(
            url,
            params={"id": dataset_id},
            headers=HEADERS,
            timeout=HTTP_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        if data.get("success"):
            return data.get("result", {}).get("resources", [])
    except Exception as e:
        logger.warning(f"Failed to fetch dataset {dataset_id}: {e}")
    return []


def extract_latest_value(
    resources: list[dict], indicator_name: str
) -> tuple[float | None, str | None]:
    """Try to extract the latest value from dataset resources.

    Attempts to download CSV/JSON resources and parse the most recent data point.
    """
    for resource in resources:
        fmt = (resource.get("format") or "").lower()
        if fmt not in ("csv", "json", "api"):
            continue

        resource_url = resource.get("url")
        if not resource_url:
            continue

        try:
            resp = httpx.get(resource_url, headers=HEADERS, timeout=HTTP_TIMEOUT)
            resp.raise_for_status()

            if fmt == "json" or "json" in (resource.get("mimetype") or ""):
                data = resp.json()
                return _parse_json_data(data, indicator_name)
            elif fmt == "csv":
                return _parse_csv_data(resp.text, indicator_name)
        except Exception as e:
            logger.debug(f"  Could not parse resource {resource_url}: {e}")
            continue

    return None, None


def _parse_json_data(data: any, indicator_name: str) -> tuple[float | None, str | None]:
    """Parse JSON data to find the latest numeric value."""
    if isinstance(data, list) and data:
        # Assume list of records sorted by date
        latest = data[-1] if isinstance(data[-1], dict) else None
        if latest:
            # Try common field names
            for key in ("value", "amount", "total", "rate", "count", indicator_name):
                val = latest.get(key)
                if val is not None:
                    try:
                        return float(val), latest.get(
                            "year", latest.get("date", str(datetime.now().year))
                        )
                    except (ValueError, TypeError):
                        continue
    elif isinstance(data, dict):
        # Single record or nested structure
        for key in ("value", "latest", "current"):
            if key in data:
                try:
                    return float(data[key]), data.get("year", str(datetime.now().year))
                except (ValueError, TypeError):
                    continue
    return None, None


def _parse_csv_data(
    csv_text: str, indicator_name: str
) -> tuple[float | None, str | None]:
    """Parse CSV data to find the latest numeric value."""
    import csv
    import io

    reader = csv.DictReader(io.StringIO(csv_text))
    rows = list(reader)
    if not rows:
        return None, None

    # Take the last row (usually most recent)
    latest = rows[-1]

    # Try to find a numeric value column
    for key, val in latest.items():
        if not val:
            continue
        try:
            num = float(val.replace(",", ""))
            year = latest.get(
                "year", latest.get("Year", latest.get("date", str(datetime.now().year)))
            )
            return num, str(year)
        except ValueError:
            continue

    return None, None


def update_indicator(indicator_name: str, value: float, year: str, source: str):
    """Update an outcome indicator with fresh data."""
    measured_date = f"{year}-01-01" if len(str(year)) == 4 else str(year)

    result = (
        db.table("outcome_indicators")
        .select("id, current_value, measured_date")
        .eq("indicator_name", indicator_name)
        .limit(1)
        .execute()
    )

    if not result.data:
        logger.debug(f"  Indicator '{indicator_name}' not found in DB, skipping")
        return False

    existing = result.data[0]
    # Only update if the data is newer or different
    if (
        existing.get("current_value") == value
        and existing.get("measured_date") == measured_date
    ):
        return False

    db.table("outcome_indicators").update(
        {
            "current_value": value,
            "measured_date": measured_date,
            "source": source,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", existing["id"]).execute()

    logger.info(
        f"  Updated {indicator_name}: {value} (as of {measured_date}) from {source}"
    )
    return True


def run():
    """Main entry point for the open data monitor agent."""
    run_id = log_agent_run("open_data_monitor")
    items_processed = 0
    items_updated = 0

    try:
        for tracked in TRACKED_DATASETS:
            logger.info(f"Searching for: {tracked['search_query']}")
            datasets = search_datasets(tracked["search_query"])
            items_processed += len(datasets)

            for dataset in datasets:
                dataset_id = dataset.get("id") or dataset.get("name")
                if not dataset_id:
                    continue

                resources = fetch_dataset_resources(dataset_id)
                if not resources:
                    continue

                source = f"opennepal.net/{dataset.get('name', dataset_id)}"

                for indicator_name in tracked["indicator_names"]:
                    value, year = extract_latest_value(resources, indicator_name)
                    if value is not None and year is not None:
                        updated = update_indicator(indicator_name, value, year, source)
                        if updated:
                            items_updated += 1
                        break  # Found data for this dataset, move on

        logger.info(
            f"Open Data Monitor: {items_updated} indicators updated from {items_processed} datasets"
        )
        complete_agent_run(run_id, "success", items_processed, items_updated)

    except Exception as e:
        logger.error(f"Open Data Monitor failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_updated, str(e))
        raise
