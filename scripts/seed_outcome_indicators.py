"""
Drishti Nepal — Seed Baseline Outcome Indicators
Seeds outcome_indicators table with baseline values at government formation (March 2026)
and manifesto targets for each karar patra priority area.

Run: python3 scripts/seed_outcome_indicators.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.common.db import db
from agents.common.utils import setup_logger

logger = setup_logger("seed_indicators")

# Government formation date (baseline)
BASELINE_DATE = "2026-03-15"
# Manifesto 5-year deadline
TARGET_DATE = "2031-03-15"

# ─────────────────────────────────────────────────────────────────
# Baseline indicators derived from:
# - Karar Patra priority areas & key_targets
# - Nepal Rastra Bank (NRB) data
# - Central Bureau of Statistics (CBS)
# - World Bank / IMF estimates
# - Transparency International
# - Nepal Electricity Authority (NEA)
# - Department of Roads (DoR)
# ─────────────────────────────────────────────────────────────────

INDICATORS = [
    # ═══════════════════════════════════════════════════════════════
    # pp-001: Integrity & Good Governance
    # ═══════════════════════════════════════════════════════════════
    {
        "indicator_name": "ti_cpi_score",
        "indicator_label": "Transparency International CPI Score",
        "category": "governance",
        "priority_area": "pp-001",
        "baseline_value": 33,
        "baseline_date": BASELINE_DATE,
        "target_value": 50,
        "target_deadline": TARGET_DATE,
        "current_value": 33,
        "measured_date": BASELINE_DATE,
        "source": "Transparency International",
        "source_url": "https://www.transparency.org/cpi",
        "unit": "score (0-100)",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "egov_index",
        "indicator_label": "UN E-Government Development Index",
        "category": "governance",
        "priority_area": "pp-001",
        "baseline_value": 0.4948,
        "baseline_date": BASELINE_DATE,
        "target_value": 0.70,
        "target_deadline": TARGET_DATE,
        "current_value": 0.4948,
        "measured_date": BASELINE_DATE,
        "source": "United Nations",
        "source_url": "https://publicadministration.un.org/egovkb",
        "unit": "index (0-1)",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "wgi_control_corruption",
        "indicator_label": "World Bank Control of Corruption Percentile",
        "category": "governance",
        "priority_area": "pp-001",
        "baseline_value": 25,
        "baseline_date": BASELINE_DATE,
        "target_value": 45,
        "target_deadline": TARGET_DATE,
        "current_value": 25,
        "measured_date": BASELINE_DATE,
        "source": "World Bank WGI",
        "source_url": "https://info.worldbank.org/governance/wgi/",
        "unit": "percentile (0-100)",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "digital_services_count",
        "indicator_label": "Government Services Available Online",
        "category": "governance",
        "priority_area": "pp-001",
        "baseline_value": 150,
        "baseline_date": BASELINE_DATE,
        "target_value": 1000,
        "target_deadline": TARGET_DATE,
        "current_value": 150,
        "measured_date": BASELINE_DATE,
        "source": "Department of IT / MoCIT",
        "source_url": "https://mocit.gov.np",
        "unit": "count",
        "direction": "higher_is_better",
    },
    # ═══════════════════════════════════════════════════════════════
    # pp-002: Middle-Class Expansion
    # ═══════════════════════════════════════════════════════════════
    {
        "indicator_name": "gdp_per_capita",
        "indicator_label": "GDP Per Capita (Current USD)",
        "category": "economy",
        "priority_area": "pp-002",
        "baseline_value": 1470,
        "baseline_date": BASELINE_DATE,
        "target_value": 3000,
        "target_deadline": TARGET_DATE,
        "current_value": 1470,
        "measured_date": BASELINE_DATE,
        "source": "World Bank / NRB",
        "source_url": "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=NP",
        "unit": "USD",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "gdp_total",
        "indicator_label": "GDP Total (Current USD, Billions)",
        "category": "economy",
        "priority_area": "pp-002",
        "baseline_value": 42.0,
        "baseline_date": BASELINE_DATE,
        "target_value": 100.0,
        "target_deadline": TARGET_DATE,
        "current_value": 42.0,
        "measured_date": BASELINE_DATE,
        "source": "World Bank / NRB",
        "source_url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=NP",
        "unit": "billion USD",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "gdp_growth_rate",
        "indicator_label": "Annual GDP Growth Rate (Constant Prices)",
        "category": "economy",
        "priority_area": "pp-002",
        "baseline_value": 3.5,
        "baseline_date": BASELINE_DATE,
        "target_value": 7.0,
        "target_deadline": TARGET_DATE,
        "current_value": 3.5,
        "measured_date": BASELINE_DATE,
        "source": "NRB / CBS",
        "source_url": "https://www.nrb.org.np",
        "unit": "%",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "health_insurance_coverage",
        "indicator_label": "Health Insurance Coverage Rate",
        "category": "health",
        "priority_area": "pp-002",
        "baseline_value": 18,
        "baseline_date": BASELINE_DATE,
        "target_value": 100,
        "target_deadline": TARGET_DATE,
        "current_value": 18,
        "measured_date": BASELINE_DATE,
        "source": "Health Insurance Board Nepal",
        "source_url": "https://hib.gov.np",
        "unit": "%",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "poverty_headcount",
        "indicator_label": "Poverty Headcount Ratio (National Poverty Line)",
        "category": "economy",
        "priority_area": "pp-002",
        "baseline_value": 20.3,
        "baseline_date": BASELINE_DATE,
        "target_value": 10.0,
        "target_deadline": TARGET_DATE,
        "current_value": 20.3,
        "measured_date": BASELINE_DATE,
        "source": "CBS / World Bank",
        "source_url": "https://data.worldbank.org/indicator/SI.POV.NAHC?locations=NP",
        "unit": "%",
        "direction": "lower_is_better",
    },
    {
        "indicator_name": "financial_inclusion",
        "indicator_label": "Bank Account Ownership (% Adults 15+)",
        "category": "economy",
        "priority_area": "pp-002",
        "baseline_value": 55,
        "baseline_date": BASELINE_DATE,
        "target_value": 95,
        "target_deadline": TARGET_DATE,
        "current_value": 55,
        "measured_date": BASELINE_DATE,
        "source": "NRB / World Bank Findex",
        "source_url": "https://www.worldbank.org/en/publication/globalfindex",
        "unit": "%",
        "direction": "higher_is_better",
    },
    # ═══════════════════════════════════════════════════════════════
    # pp-003: Jobs, Jobs, Jobs
    # ═══════════════════════════════════════════════════════════════
    {
        "indicator_name": "formal_jobs_created",
        "indicator_label": "Cumulative New Formal Jobs Created",
        "category": "labor",
        "priority_area": "pp-003",
        "baseline_value": 0,
        "baseline_date": BASELINE_DATE,
        "target_value": 500000,
        "target_deadline": TARGET_DATE,
        "current_value": 0,
        "measured_date": BASELINE_DATE,
        "source": "CBS / MoLESS",
        "source_url": "https://moless.gov.np",
        "unit": "jobs",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "unemployment_rate",
        "indicator_label": "Unemployment Rate",
        "category": "labor",
        "priority_area": "pp-003",
        "baseline_value": 11.4,
        "baseline_date": BASELINE_DATE,
        "target_value": 5.0,
        "target_deadline": TARGET_DATE,
        "current_value": 11.4,
        "measured_date": BASELINE_DATE,
        "source": "CBS / ILO",
        "source_url": "https://ilostat.ilo.org/data/country-profiles/",
        "unit": "%",
        "direction": "lower_is_better",
    },
    {
        "indicator_name": "daily_migration_outflow",
        "indicator_label": "Daily Foreign Employment Departures",
        "category": "labor",
        "priority_area": "pp-003",
        "baseline_value": 3300,
        "baseline_date": BASELINE_DATE,
        "target_value": 1500,
        "target_deadline": TARGET_DATE,
        "current_value": 3300,
        "measured_date": BASELINE_DATE,
        "source": "DoFE",
        "source_url": "https://dofe.gov.np",
        "unit": "people/day",
        "direction": "lower_is_better",
    },
    # ═══════════════════════════════════════════════════════════════
    # pp-004: Connectivity
    # ═══════════════════════════════════════════════════════════════
    {
        "indicator_name": "installed_electricity_mw",
        "indicator_label": "Installed Electricity Capacity",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "baseline_value": 3200,
        "baseline_date": BASELINE_DATE,
        "target_value": 15000,
        "target_deadline": TARGET_DATE,
        "current_value": 3200,
        "measured_date": BASELINE_DATE,
        "source": "Nepal Electricity Authority",
        "source_url": "https://www.nea.org.np",
        "unit": "MW",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "national_highway_km",
        "indicator_label": "National Highway Network Length",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "baseline_value": 13700,
        "baseline_date": BASELINE_DATE,
        "target_value": 30000,
        "target_deadline": TARGET_DATE,
        "current_value": 13700,
        "measured_date": BASELINE_DATE,
        "source": "Department of Roads",
        "source_url": "https://dor.gov.np",
        "unit": "km",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "internet_penetration",
        "indicator_label": "Internet Penetration Rate",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "baseline_value": 72,
        "baseline_date": BASELINE_DATE,
        "target_value": 98,
        "target_deadline": TARGET_DATE,
        "current_value": 72,
        "measured_date": BASELINE_DATE,
        "source": "Nepal Telecommunications Authority",
        "source_url": "https://nta.gov.np",
        "unit": "%",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "signature_projects_completed",
        "indicator_label": "Signature National Projects Completed",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "baseline_value": 0,
        "baseline_date": BASELINE_DATE,
        "target_value": 10,
        "target_deadline": TARGET_DATE,
        "current_value": 0,
        "measured_date": BASELINE_DATE,
        "source": "National Planning Commission",
        "source_url": "https://npc.gov.np",
        "unit": "count",
        "direction": "higher_is_better",
    },
    # ═══════════════════════════════════════════════════════════════
    # pp-005: Diaspora
    # ═══════════════════════════════════════════════════════════════
    {
        "indicator_name": "diaspora_online_voting",
        "indicator_label": "Online Voting for Diaspora Implemented",
        "category": "foreign_policy",
        "priority_area": "pp-005",
        "baseline_value": 0,
        "baseline_date": BASELINE_DATE,
        "target_value": 1,
        "target_deadline": TARGET_DATE,
        "current_value": 0,
        "measured_date": BASELINE_DATE,
        "source": "Election Commission Nepal",
        "source_url": "https://election.gov.np",
        "unit": "boolean (0/1)",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "diaspora_fund_size",
        "indicator_label": "Sovereign Diaspora Fund Size",
        "category": "foreign_policy",
        "priority_area": "pp-005",
        "baseline_value": 0,
        "baseline_date": BASELINE_DATE,
        "target_value": 50,
        "target_deadline": TARGET_DATE,
        "current_value": 0,
        "measured_date": BASELINE_DATE,
        "source": "NRB / MoFA",
        "source_url": "https://mofa.gov.np",
        "unit": "billion NPR",
        "direction": "higher_is_better",
    },
    {
        "indicator_name": "remittance_gdp_ratio",
        "indicator_label": "Remittance as % of GDP",
        "category": "foreign_policy",
        "priority_area": "pp-005",
        "baseline_value": 22.7,
        "baseline_date": BASELINE_DATE,
        "target_value": 15.0,
        "target_deadline": TARGET_DATE,
        "current_value": 22.7,
        "measured_date": BASELINE_DATE,
        "source": "NRB / World Bank",
        "source_url": "https://www.nrb.org.np",
        "unit": "%",
        "direction": "lower_is_better",
        "metadata": {
            "note": "Lower is better indicates reduced dependency on remittance"
        },
    },
]


def get_manifesto_item_id(source_id: str) -> str | None:
    """Look up the UUID for a manifesto item by its source_id (e.g. pp-001)."""
    result = (
        db.table("manifesto_items")
        .select("id")
        .eq("source_id", source_id)
        .limit(1)
        .execute()
    )
    return result.data[0]["id"] if result.data else None


def seed_indicators():
    logger.info(f"Seeding {len(INDICATORS)} outcome indicators...")

    # Build a lookup of priority_area -> manifesto_items UUID
    pa_ids = {}
    for ind in INDICATORS:
        pa = ind.get("priority_area")
        if pa and pa not in pa_ids:
            pa_ids[pa] = get_manifesto_item_id(pa)

    rows = []
    for ind in INDICATORS:
        row = {**ind}
        pa = row.pop("priority_area", None)
        if pa:
            row["manifesto_item_id"] = pa_ids.get(pa)
            row["priority_area"] = pa
        if "metadata" not in row:
            row["metadata"] = {}
        rows.append(row)

    # Upsert by indicator_name to be idempotent
    result = (
        db.table("outcome_indicators")
        .upsert(rows, on_conflict="indicator_name")
        .execute()
    )
    logger.info(f"Seeded {len(result.data)} outcome indicators")
    return result.data


if __name__ == "__main__":
    seed_indicators()
