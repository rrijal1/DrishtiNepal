#!/usr/bin/env python3
"""
Seed first-level measurable indicators for each of the 100 bachha patra items.

Indicators are crafted from the manifesto commitments in bachha_patra.json,
using realistic Nepal baselines (as of March 2026), publicly verifiable sources,
and 5-year targets derived from the manifesto's own language.

Run:
    python scripts/seed_bp_indicators.py

Requires SUPABASE_URL + SUPABASE_SERVICE_KEY in .env (root) or environment.
"""

import json, os, sys, uuid
from pathlib import Path
from datetime import date

# ── Load env ──────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
env_file = ROOT / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get(
    "NEXT_PUBLIC_SUPABASE_URL"
)
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")

import requests

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

BASELINE_DATE = "2026-03-27"  # govt formation
TARGET_DEADLINE = "2031-03-27"  # 5-year mandate

# ── Priority area mapping ─────────────────────────────────────────────────────


def bp_to_pp(num: int) -> str:
    if num <= 18:
        return "pp-001"
    if num <= 60:
        return "pp-002"
    if num <= 80:
        return "pp-003"
    if num <= 95:
        return "pp-004"
    return "pp-005"


# ── Fetch source_id → UUID mapping ───────────────────────────────────────────


def fetch_bp_uuids() -> dict[str, str]:
    """Returns {source_id: uuid} for all bp items."""
    url = f"{SUPABASE_URL}/rest/v1/manifesto_items?select=id,source_id&source_id=like.bp-*"
    resp = requests.get(
        url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    resp.raise_for_status()
    return {r["source_id"]: r["id"] for r in resp.json()}


# ── Load bachha patra ────────────────────────────────────────────────────────


def load_bachha_patra() -> dict:
    bp_path = ROOT / "data" / "manifesto" / "bachha_patra.json"
    return json.loads(bp_path.read_text())


# ── Indicator definitions ────────────────────────────────────────────────────
# Each bp-XXX maps to 1-3 indicators. Fields:
#   indicator_name, indicator_label, unit, baseline_value, target_value,
#   current_value (= baseline at start), direction, source, source_url,
#   category, weight (1-3, higher = more important)


def get_category_from_bp(bp: dict) -> str:
    return bp.get("category", "governance")


# Map bachha_patra categories to DB-allowed categories
# Allowed: economy, health, education, infrastructure, governance, labor, foreign_policy, environment
CATEGORY_MAP = {
    "governance": "governance",
    "economy": "economy",
    "health": "health",
    "education": "education",
    "infrastructure": "infrastructure",
    "labor": "labor",
    "foreign_policy": "foreign_policy",
    "environment": "environment",
    # Mapped categories
    "social_justice": "governance",
    "justice": "governance",
    "technology": "economy",
    "agriculture": "economy",
    "energy": "infrastructure",
    "tourism": "economy",
    "sports": "education",
    "diaspora": "foreign_policy",
}

INDICATORS: dict[str, list[dict]] = {
    # ━━ PP-001: Integrity & Good Governance (bp-001 to bp-018) ━━━━━━━━━━━━━
    "bp-001": [
        {
            "indicator_name": "bp001_state_apology_delivered",
            "indicator_label": "Formal State Apology to Dalit Communities Delivered",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "PM Office / Parliament Records",
            "source_url": "https://www.opmcm.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp001_dalit_legal_reforms_enacted",
            "indicator_label": "Anti-Discrimination Legal Reforms Enacted",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 3,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Nepal Law Commission",
            "source_url": "https://www.lawcommission.gov.np",
            "weight": 2,
        },
    ],
    "bp-002": [
        {
            "indicator_name": "bp002_genz_commission_recommendations_implemented",
            "indicator_label": "Gen-Z Inquiry Commission Recommendations Implemented",
            "unit": "% of recommendations",
            "baseline_value": 0,
            "target_value": 100,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Ministry of Home Affairs",
            "source_url": "https://www.moha.gov.np",
            "weight": 3,
        },
    ],
    "bp-003": [
        {
            "indicator_name": "bp003_asset_investigations_initiated",
            "indicator_label": "Asset Investigations of Public Officials Initiated",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 500,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "CIAA / High Commission",
            "source_url": "https://www.ciaa.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp003_confiscation_orders_amount",
            "indicator_label": "Illegally Acquired Assets Confiscated",
            "unit": "NPR crore",
            "baseline_value": 0,
            "target_value": 100,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "CIAA",
            "source_url": "https://www.ciaa.gov.np",
            "weight": 2,
        },
    ],
    "bp-004": [
        {
            "indicator_name": "bp004_nid_coverage",
            "indicator_label": "National ID Card Coverage",
            "unit": "% of eligible population",
            "baseline_value": 15,
            "target_value": 95,
            "current_value": 15,
            "direction": "higher_is_better",
            "source": "National ID Management Center",
            "source_url": "https://www.donidcr.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp004_digital_services_available",
            "indicator_label": "Government Services Available Fully Online",
            "unit": "count",
            "baseline_value": 35,
            "target_value": 300,
            "current_value": 35,
            "direction": "higher_is_better",
            "source": "NITC / e-Government Portal",
            "source_url": "https://www.nepal.gov.np",
            "weight": 3,
        },
    ],
    "bp-005": [
        {
            "indicator_name": "bp005_fraternal_orgs_abolished",
            "indicator_label": "RSP Fraternal Orgs Abolished (as Party Policy)",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "RSP Party Constitution / ECN Records",
            "source_url": "https://www.election.gov.np",
            "weight": 2,
        },
    ],
    "bp-006": [
        {
            "indicator_name": "bp006_partisan_unions_govt_abolished",
            "indicator_label": "Partisan Trade Unions Banned in Government",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Ministry of General Admin",
            "source_url": "https://www.moga.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp006_civil_servants_it_trained",
            "indicator_label": "Civil Servants Completing IT Capability Training",
            "unit": "% of total",
            "baseline_value": 10,
            "target_value": 80,
            "current_value": 10,
            "direction": "higher_is_better",
            "source": "NASC / Staff College",
            "source_url": "https://www.nasc.gov.np",
            "weight": 1,
        },
    ],
    "bp-007": [
        {
            "indicator_name": "bp007_staff_at_delivery_points",
            "indicator_label": "Govt Staff Redeployed to Service Delivery Points",
            "unit": "% of total staff at frontline",
            "baseline_value": 30,
            "target_value": 60,
            "current_value": 30,
            "direction": "higher_is_better",
            "source": "Ministry of General Administration",
            "source_url": "https://www.moga.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp007_civil_service_bill_passed",
            "indicator_label": "Civil Service Bill with Performance Indicators Passed",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Parliament Secretariat",
            "source_url": "https://hr.parliament.gov.np",
            "weight": 2,
        },
    ],
    "bp-008": [
        {
            "indicator_name": "bp008_transfer_board_operational",
            "indicator_label": "Autonomous Transfer Board Established & Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Ministry of General Administration",
            "source_url": "https://www.moga.gov.np",
            "weight": 2,
        },
    ],
    "bp-009": [
        {
            "indicator_name": "bp009_tippani_gov_launched",
            "indicator_label": "tipani.gov.np Portal Launched",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NITC",
            "source_url": "https://www.nitc.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp009_digital_signature_adoption",
            "indicator_label": "Government Agencies Using Mandatory Digital Signatures",
            "unit": "% of agencies",
            "baseline_value": 5,
            "target_value": 100,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "Controller of Certification Authority",
            "source_url": "https://www.cca.gov.np",
            "weight": 2,
        },
    ],
    "bp-010": [
        {
            "indicator_name": "bp010_constitutional_amendment_paper",
            "indicator_label": "Constitutional Amendment Discussion Paper Published",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "PM Office / Parliament",
            "source_url": "https://hr.parliament.gov.np",
            "weight": 3,
        },
    ],
    "bp-011": [
        {
            "indicator_name": "bp011_constitutional_body_reform_bills",
            "indicator_label": "Reform Bills for Constitutional Bodies Tabled",
            "unit": "count (CIAA Act, CC Act, JC Act)",
            "baseline_value": 0,
            "target_value": 3,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Parliament Secretariat",
            "source_url": "https://hr.parliament.gov.np",
            "weight": 2,
        },
    ],
    "bp-012": [
        {
            "indicator_name": "bp012_transitional_justice_cases_resolved",
            "indicator_label": "Transitional Justice Cases Resolved",
            "unit": "% of registered cases",
            "baseline_value": 5,
            "target_value": 80,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "Truth and Reconciliation Commission",
            "source_url": "https://trc.gov.np",
            "weight": 3,
        },
    ],
    "bp-013": [
        {
            "indicator_name": "bp013_merit_based_judge_appointments",
            "indicator_label": "High/Supreme Court Judges Appointed via Merit Process",
            "unit": "% of new appointments",
            "baseline_value": 0,
            "target_value": 100,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Judicial Council",
            "source_url": "https://jc.gov.np",
            "weight": 2,
        },
    ],
    "bp-014": [
        {
            "indicator_name": "bp014_court_broadcasting_study",
            "indicator_label": "Study on Live Court Broadcasting Completed",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Supreme Court",
            "source_url": "https://supremecourt.gov.np",
            "weight": 1,
        },
    ],
    "bp-015": [
        {
            "indicator_name": "bp015_public_party_funding_law",
            "indicator_label": "Public Funding for Political Parties Law Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Election Commission Nepal",
            "source_url": "https://www.election.gov.np",
            "weight": 2,
        },
    ],
    "bp-016": [
        {
            "indicator_name": "bp016_asset_disclosure_compliance",
            "indicator_label": "Ministers & MPs with Full Public Asset Disclosure",
            "unit": "% compliance",
            "baseline_value": 20,
            "target_value": 100,
            "current_value": 20,
            "direction": "higher_is_better",
            "source": "CIAA / Parliament",
            "source_url": "https://www.ciaa.gov.np",
            "weight": 2,
        },
    ],
    "bp-017": [
        {
            "indicator_name": "bp017_federal_ministry_count",
            "indicator_label": "Number of Federal Ministries",
            "unit": "count",
            "baseline_value": 25,
            "target_value": 18,
            "current_value": 25,
            "direction": "lower_is_better",
            "source": "PM Office",
            "source_url": "https://www.opmcm.gov.np",
            "weight": 3,
        },
    ],
    "bp-018": [
        {
            "indicator_name": "bp018_npc_transformed",
            "indicator_label": "NPC Transformed into Policy Research Body",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NPC",
            "source_url": "https://www.npc.gov.np",
            "weight": 1,
        },
        {
            "indicator_name": "bp018_autonomous_stats_office",
            "indicator_label": "Autonomous National Statistics Office Established",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "CBS / NPC",
            "source_url": "https://www.cbs.gov.np",
            "weight": 1,
        },
    ],
    # ━━ PP-002: Prosperous Middle-Class Nepal (bp-019 to bp-060) ━━━━━━━━━━━
    "bp-019": [
        {
            "indicator_name": "bp019_gdp_growth_rate",
            "indicator_label": "Annual Real GDP Growth Rate",
            "unit": "% (constant prices)",
            "baseline_value": 3.5,
            "target_value": 7.0,
            "current_value": 3.5,
            "direction": "higher_is_better",
            "source": "Central Bureau of Statistics",
            "source_url": "https://www.cbs.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp019_private_sector_share_gdp",
            "indicator_label": "Private Sector Share of GDP",
            "unit": "%",
            "baseline_value": 70,
            "target_value": 85,
            "current_value": 70,
            "direction": "higher_is_better",
            "source": "World Bank / CBS",
            "source_url": "https://data.worldbank.org/country/nepal",
            "weight": 2,
        },
    ],
    "bp-020": [
        {
            "indicator_name": "bp020_independent_regulators_count",
            "indicator_label": "Independent Regulatory Bodies Established/Strengthened",
            "unit": "count",
            "baseline_value": 2,
            "target_value": 8,
            "current_value": 2,
            "direction": "higher_is_better",
            "source": "PM Office / OPMCM",
            "source_url": "https://www.opmcm.gov.np",
            "weight": 2,
        },
    ],
    "bp-021": [
        {
            "indicator_name": "bp021_gdp_per_capita",
            "indicator_label": "GDP Per Capita (Current USD)",
            "unit": "USD",
            "baseline_value": 1340,
            "target_value": 3000,
            "current_value": 1340,
            "direction": "higher_is_better",
            "source": "World Bank / CBS",
            "source_url": "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=NP",
            "weight": 3,
        },
        {
            "indicator_name": "bp021_burdensome_acts_repealed",
            "indicator_label": "Burdensome Economic Acts Repealed",
            "unit": "count (out of ~24)",
            "baseline_value": 0,
            "target_value": 24,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Nepal Law Commission",
            "source_url": "https://www.lawcommission.gov.np",
            "weight": 2,
        },
    ],
    "bp-022": [
        {
            "indicator_name": "bp022_tax_burden_ratio",
            "indicator_label": "Tax Revenue to GDP Ratio",
            "unit": "%",
            "baseline_value": 22,
            "target_value": 18,
            "current_value": 22,
            "direction": "lower_is_better",
            "source": "Ministry of Finance / IRD",
            "source_url": "https://www.ird.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp022_family_income_tax_law",
            "indicator_label": "Family-Based Income Tax Thresholds Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Ministry of Finance",
            "source_url": "https://www.mof.gov.np",
            "weight": 2,
        },
    ],
    "bp-023": [
        {
            "indicator_name": "bp023_inr_peg_study_completed",
            "indicator_label": "INR Exchange Rate Peg Study Published",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Nepal Rastra Bank",
            "source_url": "https://www.nrb.org.np",
            "weight": 1,
        },
    ],
    "bp-024": [
        {
            "indicator_name": "bp024_one_stop_investment_center",
            "indicator_label": "One-Stop Investment Service Center Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Investment Board Nepal",
            "source_url": "https://www.ibn.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp024_business_registration_digital",
            "indicator_label": "Business Registration Fully Digital & Free",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Office of Company Registrar",
            "source_url": "https://www.ocr.gov.np",
            "weight": 2,
        },
    ],
    "bp-025": [
        {
            "indicator_name": "bp025_revenue_investigation_abolished",
            "indicator_label": "Revenue Investigation Dept Abolished / Reformed",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Ministry of Finance",
            "source_url": "https://www.mof.gov.np",
            "weight": 2,
        },
    ],
    "bp-026": [
        {
            "indicator_name": "bp026_public_enterprises_reformed",
            "indicator_label": "Public Enterprises Reformed / Privatized / Merged",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 20,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Ministry of Finance / PERC",
            "source_url": "https://www.mof.gov.np",
            "weight": 2,
        },
    ],
    "bp-027": [
        {
            "indicator_name": "bp027_national_pride_projects_completed",
            "indicator_label": "National Pride Projects Completed on Time (Mission Mode)",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 10,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NPC / Project Monitoring",
            "source_url": "https://www.npc.gov.np",
            "weight": 2,
        },
    ],
    "bp-028": [
        {
            "indicator_name": "bp028_project_staff_stability",
            "indicator_label": "Project Staff Retention Until Completion (No Transfer Rule)",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "OPMCM / MoGA",
            "source_url": "https://www.opmcm.gov.np",
            "weight": 1,
        },
    ],
    "bp-029": [
        {
            "indicator_name": "bp029_special_projects_launched",
            "indicator_label": "Special Science & Tech Projects Launched",
            "unit": "count (target 10)",
            "baseline_value": 0,
            "target_value": 10,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoEST",
            "source_url": "https://www.moest.gov.np",
            "weight": 2,
        },
    ],
    "bp-030": [
        {
            "indicator_name": "bp030_coops_under_nrb",
            "indicator_label": "Cooperatives (>50cr) Under NRB Supervision",
            "unit": "% of eligible",
            "baseline_value": 0,
            "target_value": 100,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Nepal Rastra Bank",
            "source_url": "https://www.nrb.org.np",
            "weight": 2,
        },
    ],
    "bp-031": [
        {
            "indicator_name": "bp031_coops_in_cic",
            "indicator_label": "Cooperatives Linked to Credit Information Center",
            "unit": "% of cooperatives",
            "baseline_value": 5,
            "target_value": 100,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "CIC Nepal",
            "source_url": "https://www.cicnepal.com.np",
            "weight": 2,
        },
    ],
    "bp-032": [
        {
            "indicator_name": "bp032_usury_declared_crime",
            "indicator_label": "Usury (Meter Byaj) Declared Economic Crime via Law",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Parliament / Nepal Law Commission",
            "source_url": "https://www.lawcommission.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp032_usury_networks_dismantled",
            "indicator_label": "Usury Networks Dismantled (Cases Filed)",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 500,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Nepal Police / District Courts",
            "source_url": "https://www.nepalpolice.gov.np",
            "weight": 2,
        },
    ],
    "bp-033": [
        {
            "indicator_name": "bp033_nepse_daily_volume",
            "indicator_label": "NEPSE Average Daily Turnover",
            "unit": "NPR crore",
            "baseline_value": 5,
            "target_value": 30,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "NEPSE",
            "source_url": "https://www.nepalstock.com.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp033_derivatives_available",
            "indicator_label": "Derivatives Trading Available on NEPSE",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "SEBON",
            "source_url": "https://www.sebon.gov.np",
            "weight": 1,
        },
    ],
    "bp-034": [
        {
            "indicator_name": "bp034_bond_market_volume",
            "indicator_label": "Corporate/Infrastructure Bond Market Volume",
            "unit": "NPR billion",
            "baseline_value": 5,
            "target_value": 50,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "SEBON / NRB",
            "source_url": "https://www.sebon.gov.np",
            "weight": 2,
        },
    ],
    "bp-035": [
        {
            "indicator_name": "bp035_it_export_value",
            "indicator_label": "Annual IT/Digital Service Exports",
            "unit": "USD billion",
            "baseline_value": 0.2,
            "target_value": 1.5,
            "current_value": 0.2,
            "direction": "higher_is_better",
            "source": "NRB / Trade & Export Promotion Centre",
            "source_url": "https://www.tepc.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp035_digital_parks_operational",
            "indicator_label": "Digital Parks Operational in Provinces",
            "unit": "count (target 7)",
            "baseline_value": 0,
            "target_value": 7,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoCIT",
            "source_url": "https://mocit.gov.np",
            "weight": 2,
        },
    ],
    "bp-036": [
        {
            "indicator_name": "bp036_data_centers_operational",
            "indicator_label": "National Data Centers Operational",
            "unit": "count",
            "baseline_value": 1,
            "target_value": 5,
            "current_value": 1,
            "direction": "higher_is_better",
            "source": "NITC / MoCIT",
            "source_url": "https://mocit.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp036_cyber_privacy_law",
            "indicator_label": "Cybersecurity & Data Privacy Law Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Parliament",
            "source_url": "https://hr.parliament.gov.np",
            "weight": 2,
        },
    ],
    "bp-037": [
        {
            "indicator_name": "bp037_international_payment_gateway",
            "indicator_label": "International Payment Gateway Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NRB",
            "source_url": "https://www.nrb.org.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp037_digital_payment_volume",
            "indicator_label": "Digital Payment Transactions Annual Volume",
            "unit": "NPR billion",
            "baseline_value": 600,
            "target_value": 3000,
            "current_value": 600,
            "direction": "higher_is_better",
            "source": "NRB Payment Systems",
            "source_url": "https://www.nrb.org.np",
            "weight": 2,
        },
    ],
    "bp-038": [
        {
            "indicator_name": "bp038_crypto_regulation_policy",
            "indicator_label": "Cryptocurrency Regulation Policy Published",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoF / NRB",
            "source_url": "https://www.nrb.org.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp038_ai_computing_export",
            "indicator_label": "AI/Cloud Computing Export Revenue",
            "unit": "USD million",
            "baseline_value": 0,
            "target_value": 50,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NRB / TEPC",
            "source_url": "https://www.tepc.gov.np",
            "weight": 2,
        },
    ],
    "bp-039": [
        {
            "indicator_name": "bp039_remote_work_legal_framework",
            "indicator_label": "Remote Work / Digital Employment Legal Framework Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoLESS",
            "source_url": "https://www.moless.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp039_digital_nomad_visas_issued",
            "indicator_label": "Digital Nomad Visas Issued Annually",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 5000,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Dept of Immigration",
            "source_url": "https://www.immigration.gov.np",
            "weight": 1,
        },
    ],
    "bp-040": [
        {
            "indicator_name": "bp040_agri_gdp_share",
            "indicator_label": "Agriculture Share of GDP",
            "unit": "%",
            "baseline_value": 24,
            "target_value": 20,
            "current_value": 24,
            "direction": "lower_is_better",
            "source": "CBS / World Bank",
            "source_url": "https://data.worldbank.org/country/nepal",
            "weight": 1,
        },
        {
            "indicator_name": "bp040_agri_insurance_coverage",
            "indicator_label": "Agricultural Insurance Coverage",
            "unit": "% of farmers",
            "baseline_value": 8,
            "target_value": 50,
            "current_value": 8,
            "direction": "higher_is_better",
            "source": "Insurance Board Nepal",
            "source_url": "https://www.nib.gov.np",
            "weight": 2,
        },
    ],
    "bp-041": [
        {
            "indicator_name": "bp041_agri_trade_deficit",
            "indicator_label": "Agricultural Trade Deficit",
            "unit": "NPR billion",
            "baseline_value": 280,
            "target_value": 150,
            "current_value": 280,
            "direction": "lower_is_better",
            "source": "TEPC / Customs Dept",
            "source_url": "https://www.tepc.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp041_cold_storage_capacity",
            "indicator_label": "National Cold Storage Capacity",
            "unit": "metric tons (thousands)",
            "baseline_value": 30,
            "target_value": 150,
            "current_value": 30,
            "direction": "higher_is_better",
            "source": "MoALD",
            "source_url": "https://www.moald.gov.np",
            "weight": 2,
        },
    ],
    "bp-042": [
        {
            "indicator_name": "bp042_agroprocessing_exports",
            "indicator_label": "Agro-Processing Export Value",
            "unit": "NPR billion",
            "baseline_value": 15,
            "target_value": 60,
            "current_value": 15,
            "direction": "higher_is_better",
            "source": "TEPC",
            "source_url": "https://www.tepc.gov.np",
            "weight": 2,
        },
    ],
    "bp-043": [
        {
            "indicator_name": "bp043_irrigated_land_area",
            "indicator_label": "Total Irrigated Agricultural Land",
            "unit": "% of arable land",
            "baseline_value": 55,
            "target_value": 80,
            "current_value": 55,
            "direction": "higher_is_better",
            "source": "DoI / MoALD",
            "source_url": "https://www.moald.gov.np",
            "weight": 2,
        },
    ],
    "bp-044": [
        {
            "indicator_name": "bp044_installed_electricity_mw",
            "indicator_label": "Total Installed Electricity Capacity",
            "unit": "MW",
            "baseline_value": 3200,
            "target_value": 10000,
            "current_value": 3200,
            "direction": "higher_is_better",
            "source": "NEA / DoED",
            "source_url": "https://www.nea.org.np",
            "weight": 3,
        },
    ],
    "bp-045": [
        {
            "indicator_name": "bp045_energy_storage_mw",
            "indicator_label": "Energy Storage Capacity",
            "unit": "MW",
            "baseline_value": 0,
            "target_value": 500,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NEA / MoEWRI",
            "source_url": "https://www.moewri.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp045_solar_wind_grid_mw",
            "indicator_label": "Solar & Wind Connected to Grid",
            "unit": "MW",
            "baseline_value": 100,
            "target_value": 1000,
            "current_value": 100,
            "direction": "higher_is_better",
            "source": "AEPC / NEA",
            "source_url": "https://www.aepc.gov.np",
            "weight": 2,
        },
    ],
    "bp-046": [
        {
            "indicator_name": "bp046_domestic_electricity_gwh",
            "indicator_label": "Annual Domestic Electricity Consumption",
            "unit": "GWh",
            "baseline_value": 9000,
            "target_value": 20000,
            "current_value": 9000,
            "direction": "higher_is_better",
            "source": "NEA Annual Report",
            "source_url": "https://www.nea.org.np",
            "weight": 2,
        },
    ],
    "bp-047": [
        {
            "indicator_name": "bp047_energy_export_agreements",
            "indicator_label": "Cross-Border Energy Export Agreements Signed",
            "unit": "count",
            "baseline_value": 1,
            "target_value": 5,
            "current_value": 1,
            "direction": "higher_is_better",
            "source": "MoEWRI / NEA",
            "source_url": "https://www.moewri.gov.np",
            "weight": 2,
        },
    ],
    "bp-048": [
        {
            "indicator_name": "bp048_tourist_arrivals",
            "indicator_label": "Annual Tourist Arrivals",
            "unit": "thousands",
            "baseline_value": 900,
            "target_value": 1800,
            "current_value": 900,
            "direction": "higher_is_better",
            "source": "Nepal Tourism Board",
            "source_url": "https://www.welcomenepal.com",
            "weight": 3,
        },
        {
            "indicator_name": "bp048_per_visitor_spending",
            "indicator_label": "Average Per-Visitor Spending",
            "unit": "USD",
            "baseline_value": 50,
            "target_value": 100,
            "current_value": 50,
            "direction": "higher_is_better",
            "source": "Nepal Tourism Board",
            "source_url": "https://www.welcomenepal.com",
            "weight": 2,
        },
    ],
    "bp-049": [
        {
            "indicator_name": "bp049_single_tourism_platform",
            "indicator_label": "Single Digital Tourism Platform Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NTB / MoCTCA",
            "source_url": "https://www.tourism.gov.np",
            "weight": 2,
        },
    ],
    "bp-050": [
        {
            "indicator_name": "bp050_religious_tourism_visitors",
            "indicator_label": "Religious/Cultural Tourism Visitors at Lumbini+Janakpur",
            "unit": "thousands annually",
            "baseline_value": 200,
            "target_value": 600,
            "current_value": 200,
            "direction": "higher_is_better",
            "source": "NTB / Lumbini Development Trust",
            "source_url": "https://www.welcomenepal.com",
            "weight": 2,
        },
    ],
    "bp-051": [
        {
            "indicator_name": "bp051_mountain_school_established",
            "indicator_label": "International Mountain Training School Established",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NMA / MoCTCA",
            "source_url": "https://www.tourism.gov.np",
            "weight": 2,
        },
    ],
    "bp-052": [
        {
            "indicator_name": "bp052_aviation_blacklist_removed",
            "indicator_label": "Nepal Removed from EU Aviation Blacklist",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "CAAN / EU Air Safety List",
            "source_url": "https://transport.ec.europa.eu/transport-themes/eu-air-safety-list_en",
            "weight": 3,
        },
        {
            "indicator_name": "bp052_nepal_airlines_listed",
            "indicator_label": "Nepal Airlines Listed on Stock Exchange",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "SEBON / NEPSE",
            "source_url": "https://www.nepalstock.com.np",
            "weight": 2,
        },
    ],
    "bp-053": [
        {
            "indicator_name": "bp053_regional_airports_operational",
            "indicator_label": "Regional International Airports Fully Operational",
            "unit": "count (Pokhara, Bhairahawa)",
            "baseline_value": 0,
            "target_value": 2,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "CAAN",
            "source_url": "https://caanepal.gov.np",
            "weight": 3,
        },
    ],
    "bp-054": [
        {
            "indicator_name": "bp054_transport_syndicates_ended",
            "indicator_label": "Transport Syndicate System Replaced with Open Permits",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "DoTM",
            "source_url": "https://www.dotm.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp054_electric_buses_operational",
            "indicator_label": "Electric Buses in Public Transit",
            "unit": "count",
            "baseline_value": 50,
            "target_value": 1000,
            "current_value": 50,
            "direction": "higher_is_better",
            "source": "Sajha Yatayat / DoTM",
            "source_url": "https://www.dotm.gov.np",
            "weight": 2,
        },
    ],
    "bp-055": [
        {
            "indicator_name": "bp055_gps_tracking_public_transport",
            "indicator_label": "Public Transport Vehicles with GPS Tracking",
            "unit": "% of fleet",
            "baseline_value": 5,
            "target_value": 100,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "DoTM / Traffic Police",
            "source_url": "https://www.dotm.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp055_road_fatality_rate",
            "indicator_label": "Road Traffic Fatality Rate",
            "unit": "per 100,000 population",
            "baseline_value": 15,
            "target_value": 8,
            "current_value": 15,
            "direction": "lower_is_better",
            "source": "Nepal Police / WHO",
            "source_url": "https://www.nepalpolice.gov.np",
            "weight": 2,
        },
    ],
    "bp-056": [
        {
            "indicator_name": "bp056_green_spaces_municipalities",
            "indicator_label": "Municipalities with Public Green Spaces/Parks",
            "unit": "% of municipalities",
            "baseline_value": 20,
            "target_value": 80,
            "current_value": 20,
            "direction": "higher_is_better",
            "source": "MoUD",
            "source_url": "https://www.moud.gov.np",
            "weight": 1,
        },
    ],
    "bp-057": [
        {
            "indicator_name": "bp057_open_area_standard_adopted",
            "indicator_label": "National Open Area Standard Adopted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoUD / KVDA",
            "source_url": "https://www.moud.gov.np",
            "weight": 1,
        },
    ],
    "bp-058": [
        {
            "indicator_name": "bp058_national_highway_km",
            "indicator_label": "Total National Highway Network",
            "unit": "km",
            "baseline_value": 13700,
            "target_value": 20000,
            "current_value": 13700,
            "direction": "higher_is_better",
            "source": "DoR / MoPIT",
            "source_url": "https://www.dor.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp058_bypass_roads_completed",
            "indicator_label": "Highway Town Bypass Roads Completed",
            "unit": "count (target 8+)",
            "baseline_value": 1,
            "target_value": 8,
            "current_value": 1,
            "direction": "higher_is_better",
            "source": "DoR",
            "source_url": "https://www.dor.gov.np",
            "weight": 2,
        },
    ],
    "bp-059": [
        {
            "indicator_name": "bp059_railway_masterplan_published",
            "indicator_label": "50-Year Railway Master Plan Published",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Railway Dept / MoPIT",
            "source_url": "https://www.mopit.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp059_railway_km_operational",
            "indicator_label": "Railway Track Operational",
            "unit": "km",
            "baseline_value": 59,
            "target_value": 200,
            "current_value": 59,
            "direction": "higher_is_better",
            "source": "Nepal Railway Company",
            "source_url": "https://www.mopit.gov.np",
            "weight": 2,
        },
    ],
    "bp-060": [
        {
            "indicator_name": "bp060_mining_policy_enacted",
            "indicator_label": "New Mining Policy & Mines Authority Established",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoICS",
            "source_url": "https://www.moics.gov.np",
            "weight": 2,
        },
    ],
    # ━━ PP-003: Jobs & Opportunity (bp-061 to bp-080) ━━━━━━━━━━━━━━━━━━━━━━
    "bp-061": [
        {
            "indicator_name": "bp061_partisan_activity_ban_enacted",
            "indicator_label": "Ban on Partisan Activity in Educational Institutions Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoEST / Parliament",
            "source_url": "https://www.moest.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp061_teacher_political_ban",
            "indicator_label": "Teachers Prohibited from Active Political Affiliation",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Teacher Service Commission",
            "source_url": "https://www.tsc.gov.np",
            "weight": 2,
        },
    ],
    "bp-062": [
        {
            "indicator_name": "bp062_public_education_budget_share",
            "indicator_label": "Public Education Budget as % of Total Budget",
            "unit": "%",
            "baseline_value": 11,
            "target_value": 15,
            "current_value": 11,
            "direction": "higher_is_better",
            "source": "Ministry of Finance / Red Book",
            "source_url": "https://www.mof.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp062_sei_learning_outcomes",
            "indicator_label": "Grade 8 National Assessment Pass Rate (Public Schools)",
            "unit": "%",
            "baseline_value": 45,
            "target_value": 70,
            "current_value": 45,
            "direction": "higher_is_better",
            "source": "ERO / CDC",
            "source_url": "https://www.ero.gov.np",
            "weight": 3,
        },
    ],
    "bp-063": [
        {
            "indicator_name": "bp063_private_school_fee_regulation",
            "indicator_label": "Private School Fee Regulation Framework Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoEST",
            "source_url": "https://www.moest.gov.np",
            "weight": 2,
        },
    ],
    "bp-064": [
        {
            "indicator_name": "bp064_inclusive_model_schools",
            "indicator_label": "Model Inclusive Schools Established (1/province)",
            "unit": "count (target 7)",
            "baseline_value": 0,
            "target_value": 7,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoEST",
            "source_url": "https://www.moest.gov.np",
            "weight": 2,
        },
    ],
    "bp-065": [
        {
            "indicator_name": "bp065_merit_teacher_selection",
            "indicator_label": "Teacher Appointments via Merit-Based Open Competition",
            "unit": "% of new hires",
            "baseline_value": 40,
            "target_value": 100,
            "current_value": 40,
            "direction": "higher_is_better",
            "source": "Teacher Service Commission",
            "source_url": "https://www.tsc.gov.np",
            "weight": 2,
        },
    ],
    "bp-066": [
        {
            "indicator_name": "bp066_university_industry_collab",
            "indicator_label": "Universities with Formal Industry Collaboration MoUs",
            "unit": "count",
            "baseline_value": 5,
            "target_value": 30,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "UGC Nepal",
            "source_url": "https://www.ugcnepal.edu.np",
            "weight": 2,
        },
    ],
    "bp-067": [
        {
            "indicator_name": "bp067_foreign_universities_operating",
            "indicator_label": "Foreign University Campuses Operating in Nepal",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 5,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "UGC / MoEST",
            "source_url": "https://www.ugcnepal.edu.np",
            "weight": 2,
        },
    ],
    "bp-068": [
        {
            "indicator_name": "bp068_province_sports_infra",
            "indicator_label": "Provinces with World-Class Sports Infrastructure",
            "unit": "count (target 7)",
            "baseline_value": 1,
            "target_value": 7,
            "current_value": 1,
            "direction": "higher_is_better",
            "source": "NSC",
            "source_url": "https://www.nsc.gov.np",
            "weight": 2,
        },
    ],
    "bp-069": [
        {
            "indicator_name": "bp069_athletes_pension_fund",
            "indicator_label": "Athletes Pension Fund Established & Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NSC",
            "source_url": "https://www.nsc.gov.np",
            "weight": 2,
        },
    ],
    "bp-070": [
        {
            "indicator_name": "bp070_health_facilities_meeting_standards",
            "indicator_label": "Health Facilities Meeting National Minimum Standards",
            "unit": "% of facilities",
            "baseline_value": 20,
            "target_value": 80,
            "current_value": 20,
            "direction": "higher_is_better",
            "source": "DoHS / MoHP",
            "source_url": "https://www.mohp.gov.np",
            "weight": 3,
        },
    ],
    "bp-071": [
        {
            "indicator_name": "bp071_health_insurance_coverage",
            "indicator_label": "Population Covered by Health Insurance",
            "unit": "% of population",
            "baseline_value": 25,
            "target_value": 100,
            "current_value": 25,
            "direction": "higher_is_better",
            "source": "Health Insurance Board",
            "source_url": "https://www.hib.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp071_mental_health_in_insurance",
            "indicator_label": "Mental Health Services Covered in Insurance Package",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Health Insurance Board",
            "source_url": "https://www.hib.gov.np",
            "weight": 2,
        },
    ],
    "bp-072": [
        {
            "indicator_name": "bp072_ncd_screening_coverage",
            "indicator_label": "Adults (40+) Screened for NCDs Annually",
            "unit": "% of target population",
            "baseline_value": 5,
            "target_value": 40,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "DoHS / MoHP",
            "source_url": "https://www.mohp.gov.np",
            "weight": 2,
        },
    ],
    "bp-073": [
        {
            "indicator_name": "bp073_disability_rehab_centers",
            "indicator_label": "Provincial Disability Rehabilitation Centers Operational",
            "unit": "count (target 7)",
            "baseline_value": 1,
            "target_value": 7,
            "current_value": 1,
            "direction": "higher_is_better",
            "source": "MoHP / MoWCSC",
            "source_url": "https://www.mohp.gov.np",
            "weight": 2,
        },
    ],
    "bp-074": [
        {
            "indicator_name": "bp074_early_screening_local_desks",
            "indicator_label": "Local Health Desks with Early Disability Screening",
            "unit": "% of local health units",
            "baseline_value": 5,
            "target_value": 80,
            "current_value": 5,
            "direction": "higher_is_better",
            "source": "DoHS / MoHP",
            "source_url": "https://www.mohp.gov.np",
            "weight": 2,
        },
    ],
    "bp-075": [
        {
            "indicator_name": "bp075_yoga_meditation_programs",
            "indicator_label": "Institutional Yoga/Meditation Programs in Schools",
            "unit": "count of schools",
            "baseline_value": 50,
            "target_value": 1000,
            "current_value": 50,
            "direction": "higher_is_better",
            "source": "MoEST",
            "source_url": "https://www.moest.gov.np",
            "weight": 1,
        },
    ],
    "bp-076": [
        {
            "indicator_name": "bp076_burn_hospital_operational",
            "indicator_label": "World-Class Burn Hospital Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoHP",
            "source_url": "https://www.mohp.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp076_burn_treatment_fund_size",
            "indicator_label": "Burn Treatment Fund Balance",
            "unit": "NPR crore",
            "baseline_value": 0,
            "target_value": 50,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoHP",
            "source_url": "https://www.mohp.gov.np",
            "weight": 2,
        },
    ],
    "bp-077": [
        {
            "indicator_name": "bp077_mental_health_specialists",
            "indicator_label": "District Hospitals with Mental Health Specialists",
            "unit": "% of 77 districts",
            "baseline_value": 10,
            "target_value": 100,
            "current_value": 10,
            "direction": "higher_is_better",
            "source": "MoHP",
            "source_url": "https://www.mohp.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp077_mental_health_helpline",
            "indicator_label": "24/7 National Mental Health Helpline Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoHP",
            "source_url": "https://www.mohp.gov.np",
            "weight": 2,
        },
    ],
    "bp-078": [
        {
            "indicator_name": "bp078_informal_sector_formalized",
            "indicator_label": "Informal Workers Brought into Formal Social Security",
            "unit": "% of labor force",
            "baseline_value": 15,
            "target_value": 50,
            "current_value": 15,
            "direction": "higher_is_better",
            "source": "Social Security Fund / SSF",
            "source_url": "https://www.ssf.gov.np",
            "weight": 2,
        },
    ],
    "bp-079": [
        {
            "indicator_name": "bp079_foreign_employment_fraud_cases",
            "indicator_label": "Recruitment Fraud Complaints Resolved",
            "unit": "% resolution rate",
            "baseline_value": 20,
            "target_value": 80,
            "current_value": 20,
            "direction": "higher_is_better",
            "source": "DoFE",
            "source_url": "https://www.dofe.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp079_migrant_worker_id_coverage",
            "indicator_label": "Migrant Workers with Special ID Cards",
            "unit": "% of registered workers",
            "baseline_value": 0,
            "target_value": 100,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "DoFE",
            "source_url": "https://www.dofe.gov.np",
            "weight": 2,
        },
    ],
    "bp-080": [
        {
            "indicator_name": "bp080_dalit_concessional_loans",
            "indicator_label": "Concessional Loans Disbursed to Dalit Workers",
            "unit": "count (loans disbursed)",
            "baseline_value": 0,
            "target_value": 10000,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NRB / Commercial Banks",
            "source_url": "https://www.nrb.org.np",
            "weight": 2,
        },
    ],
    # ━━ PP-004: Connected Nepal (bp-081 to bp-095) ━━━━━━━━━━━━━━━━━━━━━━━━━
    "bp-081": [
        {
            "indicator_name": "bp081_earthquake_code_compliance",
            "indicator_label": "New Buildings Meeting Earthquake-Resistant Code",
            "unit": "% of permits",
            "baseline_value": 30,
            "target_value": 95,
            "current_value": 30,
            "direction": "higher_is_better",
            "source": "MoUD / DUDBC",
            "source_url": "https://www.moud.gov.np",
            "weight": 2,
        },
    ],
    "bp-082": [
        {
            "indicator_name": "bp082_land_rights_authority",
            "indicator_label": "National Land Rights Authority Established",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoLRM",
            "source_url": "https://www.molrm.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp082_landless_titled",
            "indicator_label": "Landless Families Receiving Permanent Land Titles",
            "unit": "count (thousands)",
            "baseline_value": 0,
            "target_value": 50,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Land Commission / MoLRM",
            "source_url": "https://www.molrm.gov.np",
            "weight": 3,
        },
    ],
    "bp-083": [
        {
            "indicator_name": "bp083_integrated_settlements",
            "indicator_label": "Integrated Settlements Developed for Scattered Communities",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 30,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoUD",
            "source_url": "https://www.moud.gov.np",
            "weight": 1,
        },
    ],
    "bp-084": [
        {
            "indicator_name": "bp084_first_home_incentive",
            "indicator_label": "First Home Incentive Policy Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoF / NRB",
            "source_url": "https://www.mof.gov.np",
            "weight": 2,
        },
    ],
    "bp-085": [
        {
            "indicator_name": "bp085_social_security_database",
            "indicator_label": "Unified Social Security Database Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "SSF / MoWCSC",
            "source_url": "https://www.ssf.gov.np",
            "weight": 2,
        },
    ],
    "bp-086": [
        {
            "indicator_name": "bp086_forest_carbon_revenue",
            "indicator_label": "Annual Carbon Trading Revenue from Forests",
            "unit": "NPR crore",
            "baseline_value": 0,
            "target_value": 50,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoFE / REDD",
            "source_url": "https://www.mofe.gov.np",
            "weight": 2,
        },
    ],
    "bp-087": [
        {
            "indicator_name": "bp087_wildlife_human_conflict_compensation",
            "indicator_label": "Wildlife-Human Conflict Compensation Claims Settled",
            "unit": "% of filed claims",
            "baseline_value": 30,
            "target_value": 90,
            "current_value": 30,
            "direction": "higher_is_better",
            "source": "DNPWC",
            "source_url": "https://www.dnpwc.gov.np",
            "weight": 2,
        },
    ],
    "bp-088": [
        {
            "indicator_name": "bp088_fire_alert_center_operational",
            "indicator_label": "National Forest Fire High-Alert Center Operational",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "DoF / MoFE",
            "source_url": "https://www.mofe.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp088_fire_response_time",
            "indicator_label": "Average Forest Fire Response Time",
            "unit": "hours",
            "baseline_value": 48,
            "target_value": 6,
            "current_value": 48,
            "direction": "lower_is_better",
            "source": "DoF",
            "source_url": "https://www.mofe.gov.np",
            "weight": 2,
        },
    ],
    "bp-089": [
        {
            "indicator_name": "bp089_eia_approval_days",
            "indicator_label": "Average EIA Approval Time for Infrastructure Projects",
            "unit": "days",
            "baseline_value": 365,
            "target_value": 90,
            "current_value": 365,
            "direction": "lower_is_better",
            "source": "MoFE",
            "source_url": "https://www.mofe.gov.np",
            "weight": 2,
        },
    ],
    "bp-090": [
        {
            "indicator_name": "bp090_chure_protected_area_km2",
            "indicator_label": "Chure Fully Protected Areas Established",
            "unit": "sq km",
            "baseline_value": 0,
            "target_value": 500,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Chure Conservation Authority",
            "source_url": "https://www.mofe.gov.np",
            "weight": 2,
        },
    ],
    "bp-091": [
        {
            "indicator_name": "bp091_arsenic_safe_water_coverage",
            "indicator_label": "Terai Households with Arsenic-Safe Drinking Water",
            "unit": "%",
            "baseline_value": 50,
            "target_value": 95,
            "current_value": 50,
            "direction": "higher_is_better",
            "source": "DWSSM",
            "source_url": "https://www.dwssm.gov.np",
            "weight": 3,
        },
    ],
    "bp-092": [
        {
            "indicator_name": "bp092_waste_segregation_municipalities",
            "indicator_label": "Municipalities with Mandatory Waste Segregation",
            "unit": "% of municipalities",
            "baseline_value": 10,
            "target_value": 80,
            "current_value": 10,
            "direction": "higher_is_better",
            "source": "MoUD / SWM",
            "source_url": "https://www.moud.gov.np",
            "weight": 2,
        },
    ],
    "bp-093": [
        {
            "indicator_name": "bp093_kathmandu_pm25",
            "indicator_label": "Kathmandu Valley Annual Average PM2.5",
            "unit": "μg/m³",
            "baseline_value": 75,
            "target_value": 25,
            "current_value": 75,
            "direction": "lower_is_better",
            "source": "DoEnv / WHO",
            "source_url": "https://www.doenv.gov.np",
            "weight": 3,
        },
    ],
    "bp-094": [
        {
            "indicator_name": "bp094_early_warning_coverage",
            "indicator_label": "Disaster-Prone Local Units with Early Warning Systems",
            "unit": "% of at-risk local units",
            "baseline_value": 15,
            "target_value": 90,
            "current_value": 15,
            "direction": "higher_is_better",
            "source": "NDRRMA / MoHA",
            "source_url": "https://www.ndrrma.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp094_airport_relief_centers",
            "indicator_label": "Airport-Based Relief Centers Operational",
            "unit": "count (target 5)",
            "baseline_value": 0,
            "target_value": 5,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "NDRRMA",
            "source_url": "https://www.ndrrma.gov.np",
            "weight": 2,
        },
    ],
    "bp-095": [
        {
            "indicator_name": "bp095_climate_finance_strategy",
            "indicator_label": "National Climate Finance Strategy Published",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoFE",
            "source_url": "https://www.mofe.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp095_climate_finance_mobilized",
            "indicator_label": "International Climate Finance Mobilized",
            "unit": "USD million",
            "baseline_value": 50,
            "target_value": 500,
            "current_value": 50,
            "direction": "higher_is_better",
            "source": "MoFE / Green Climate Fund",
            "source_url": "https://www.greenclimate.fund",
            "weight": 2,
        },
    ],
    # ━━ PP-005: Diaspora & Global Nepal (bp-096 to bp-100) ━━━━━━━━━━━━━━━━━
    "bp-096": [
        {
            "indicator_name": "bp096_tripartite_agreements",
            "indicator_label": "Tripartite (Nepal-India-China) Economic Partnerships",
            "unit": "count",
            "baseline_value": 0,
            "target_value": 3,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoFA",
            "source_url": "https://www.mofa.gov.np",
            "weight": 2,
        },
    ],
    "bp-097": [
        {
            "indicator_name": "bp097_border_security_force",
            "indicator_label": "Specialized Border Security Force Established",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoHA",
            "source_url": "https://www.moha.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp097_digital_border_entry_exit",
            "indicator_label": "Border Points with Digital Entry-Exit Records",
            "unit": "% of major border points",
            "baseline_value": 10,
            "target_value": 100,
            "current_value": 10,
            "direction": "higher_is_better",
            "source": "Immigration Dept / MoHA",
            "source_url": "https://www.immigration.gov.np",
            "weight": 2,
        },
    ],
    "bp-098": [
        {
            "indicator_name": "bp098_diplomatic_mission_audit",
            "indicator_label": "Diplomatic Missions with Published Performance Audits",
            "unit": "% of missions",
            "baseline_value": 0,
            "target_value": 100,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "MoFA",
            "source_url": "https://www.mofa.gov.np",
            "weight": 2,
        },
        {
            "indicator_name": "bp098_digital_consular_services",
            "indicator_label": "Consular Services Available Digitally",
            "unit": "% of key services",
            "baseline_value": 10,
            "target_value": 90,
            "current_value": 10,
            "direction": "higher_is_better",
            "source": "MoFA",
            "source_url": "https://www.mofa.gov.np",
            "weight": 2,
        },
    ],
    "bp-099": [
        {
            "indicator_name": "bp099_overseas_voting_law",
            "indicator_label": "Online Voting Rights Law for Overseas Nepalis Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Election Commission",
            "source_url": "https://www.election.gov.np",
            "weight": 3,
        },
        {
            "indicator_name": "bp099_nrn_investment_protection_law",
            "indicator_label": "NRN Investment Legal Protection Enacted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "Parliament / MoLJPA",
            "source_url": "https://hr.parliament.gov.np",
            "weight": 2,
        },
    ],
    "bp-100": [
        {
            "indicator_name": "bp100_party_integrity_mechanism",
            "indicator_label": "Party Integrity Mechanism with Code of Conduct Adopted",
            "unit": "yes/no (0-1)",
            "baseline_value": 0,
            "target_value": 1,
            "current_value": 0,
            "direction": "higher_is_better",
            "source": "ECN / RSP",
            "source_url": "https://www.election.gov.np",
            "weight": 2,
        },
    ],
}


def main():
    print("Loading bachha patra data...")
    bp_data = load_bachha_patra()
    foundations = {f["id"]: f for f in bp_data["foundations"]}

    print("Fetching manifesto item UUIDs...")
    bp_uuids = fetch_bp_uuids()
    print(f"  Found {len(bp_uuids)} bp items in DB")

    # Build rows
    rows = []
    covered = set()
    for bp_id, ind_list in INDICATORS.items():
        if bp_id not in bp_uuids:
            print(f"  WARNING: {bp_id} not found in DB, skipping")
            continue
        manifest_uuid = bp_uuids[bp_id]
        bp_num = int(bp_id.split("-")[1])
        pp = bp_to_pp(bp_num)
        cat = foundations.get(bp_id, {}).get("category", "governance")
        cat = CATEGORY_MAP.get(cat, "governance")

        for ind in ind_list:
            rows.append(
                {
                    "indicator_name": ind["indicator_name"],
                    "indicator_label": ind["indicator_label"],
                    "category": cat,
                    "priority_area": pp,
                    "manifesto_item_id": manifest_uuid,
                    "baseline_value": ind["baseline_value"],
                    "baseline_date": BASELINE_DATE,
                    "target_value": ind["target_value"],
                    "target_deadline": TARGET_DEADLINE,
                    "current_value": ind["current_value"],
                    "measured_date": BASELINE_DATE,
                    "source": ind["source"],
                    "source_url": ind["source_url"],
                    "unit": ind["unit"],
                    "direction": ind["direction"],
                    "metadata": {},
                }
            )
        covered.add(bp_id)

    print(f"\nIndicator coverage: {len(covered)}/100 bp items")
    print(f"Total indicator rows: {len(rows)}")

    # Check for existing indicator_names to avoid duplicates
    existing_url = f"{SUPABASE_URL}/rest/v1/outcome_indicators?select=indicator_name"
    resp = requests.get(
        existing_url,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    resp.raise_for_status()
    existing_names = {r["indicator_name"] for r in resp.json()}
    new_rows = [r for r in rows if r["indicator_name"] not in existing_names]
    skipped = len(rows) - len(new_rows)
    if skipped:
        print(f"Skipping {skipped} indicators that already exist")

    if not new_rows:
        print("No new indicators to insert.")
        return

    # Insert in batches of 50
    BATCH = 50
    total_inserted = 0
    for i in range(0, len(new_rows), BATCH):
        batch = new_rows[i : i + BATCH]
        url = f"{SUPABASE_URL}/rest/v1/outcome_indicators"
        resp = requests.post(url, json=batch, headers=HEADERS)
        if resp.status_code in (200, 201):
            total_inserted += len(batch)
            print(f"  Inserted batch {i//BATCH + 1}: {len(batch)} rows")
        else:
            print(f"  ERROR batch {i//BATCH + 1}: {resp.status_code} {resp.text}")
            # Try one by one to identify the problem row
            for row in batch:
                r2 = requests.post(url, json=row, headers=HEADERS)
                if r2.status_code in (200, 201):
                    total_inserted += 1
                else:
                    print(
                        f"    FAILED: {row['indicator_name']}: {r2.status_code} {r2.text[:200]}"
                    )

    print(
        f"\nDone! Inserted {total_inserted} new indicators across {len(covered)} commitments."
    )
    uncovered = set(f"bp-{i:03d}" for i in range(1, 101)) - covered
    if uncovered:
        print(f"Uncovered bp items (no indicators defined): {sorted(uncovered)}")


if __name__ == "__main__":
    main()
