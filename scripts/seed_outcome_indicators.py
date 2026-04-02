"""
Drishti Nepal — Seed Outcome Indicators (v1 — Outcome-Only Model)

Seeds outcome_indicators with:
  - Baseline values at government formation (March 27, 2026)
  - Most-recent current values (April 2, 2026)
  - Manifesto targets (5-year horizon, March 2031)
  - Per-indicator weights (1–100 scale, community-agreed defaults)
  - Ministry attribution (primary + shared portfolios)

Indicator design principles:
  1. Every indicator maps directly to a karar patra key_target
  2. All karar patra areas (pp-001 → pp-005) are covered first
  3. Sources are named, authoritative bodies only
  4. Direction-aware: "lower_is_better" for poverty, inflation, migration, pollution
  5. For shared-responsibility indicators, metadata.ministries carries additional portfolios

Data sources:
  - Transparency International (TI CPI)
  - World Bank (WGI, GDP, poverty)
  - Nepal Rastra Bank / NRB (economic, remittance)
  - Central Bureau of Statistics / CBS (employment, poverty, GDP growth)
  - Health Insurance Board (HIB)
  - Nepal Electricity Authority (NEA)
  - Department of Roads (DoR)
  - Nepal Telecommunications Authority (NTA)
  - UN DESA (e-government index)
  - Department of Foreign Employment (DoFE)
  - Council for Technical Education and Vocational Training (CTEVT)
  - Nepal Tourism Board / Ministry of Tourism

Run: python3 scripts/seed_outcome_indicators.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from agents.common.db import db
from agents.common.utils import setup_logger

logger = setup_logger("seed_indicators")

# Balendra Shah cabinet formed on March 27, 2026
BASELINE_DATE = "2026-03-27"
# First measurement after formation — April 2, 2026 (today)
CURRENT_DATE = "2026-04-02"
# Manifesto 5-year delivery deadline
TARGET_DATE = "2031-03-27"

# ─────────────────────────────────────────────────────────────────────────────
# INDICATOR REGISTRY
#
# Field reference:
#   indicator_name          — unique slug (used for upsert)
#   indicator_label         — human-readable label (English)
#   category                — DB enum: economy|health|education|infrastructure|
#                             governance|labor|foreign_policy|environment
#   priority_area           — karar patra area code: pp-001 → pp-005
#   ministry                — primary responsible portfolio (exact string from cabinet)
#   baseline_value          — value at government formation (March 27, 2026)
#   baseline_date           — BASELINE_DATE
#   current_value           — latest known value (April 2, 2026)
#   measured_date           — date of current_value measurement
#   target_value            — manifesto 5-year target
#   target_deadline         — TARGET_DATE
#   direction               — "higher_is_better" | "lower_is_better"
#   weight                  — integer 1–100; default community initial weights below
#   source                  — named authoritative institution
#   source_url              — canonical data URL
#   unit                    — measurement unit
#   metadata                — optional: {"ministries": [...], "notes": "..."}
#
# Weight rationale:
#   10  = core manifesto number target (GDP per capita, 500k jobs, 15,000 MW)
#   8–9 = major structural indicator (GDP growth, poverty, highways)
#   6–7 = important sectoral metric
#   4–5 = supporting / secondary metric
#   1–3 = long-horizon or binary implementation indicator
# ─────────────────────────────────────────────────────────────────────────────

INDICATORS = [
    # ═══════════════════════════════════════════════════════════════════════════
    # pp-001: INTEGRITY AND GOOD GOVERNANCE
    # Karar Patra goal: Anti-Corruption Mega-Campaign; universal digital services;
    # massive TI CPI improvement; end politicization; investigate deals since 2076 BS
    # Bachha Patra items: bp-001 → bp-018 (18 items)
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "indicator_name": "ti_cpi_score",
        "indicator_label": "Transparency International CPI Score",
        "category": "governance",
        "priority_area": "pp-001",
        "ministry": "Prime Minister, Defence, and Industry",
        "baseline_value": 33,
        "baseline_date": BASELINE_DATE,
        "current_value": 33,
        "measured_date": BASELINE_DATE,  # Annual — next TI publication Jan 2027
        "target_value": 50,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 10,
        "source": "Transparency International",
        "source_url": "https://www.transparency.org/cpi",
        "unit": "score (0–100)",
        "metadata": {
            "notes": "Nepal scored 33/100 in 2024 CPI (published Jan 2025). "
            "Target of 50 represents a significant but achievable improvement. "
            "Published annually each January. Next data point: Jan 2027."
        },
    },
    {
        "indicator_name": "wgi_control_of_corruption_pct",
        "indicator_label": "World Bank Control of Corruption Percentile Rank",
        "category": "governance",
        "priority_area": "pp-001",
        "ministry": "Prime Minister, Defence, and Industry",
        "baseline_value": 25.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 25.0,
        "measured_date": BASELINE_DATE,  # Annual — published each Sep-Oct
        "target_value": 45.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 8,
        "source": "World Bank Worldwide Governance Indicators",
        "source_url": "https://info.worldbank.org/governance/wgi/",
        "unit": "percentile (0–100)",
        "metadata": {
            "notes": "Nepal at 25th percentile in 2023 WGI data. "
            "Target 45th percentile reflects governance reforms from bp-003–bp-018."
        },
    },
    {
        "indicator_name": "egov_development_index",
        "indicator_label": "UN E-Government Development Index",
        "category": "governance",
        "priority_area": "pp-001",
        "ministry": "Communication and Information",
        "baseline_value": 0.4948,
        "baseline_date": BASELINE_DATE,
        "current_value": 0.4948,
        "measured_date": BASELINE_DATE,  # Biennial — next UN EGDI survey 2026
        "target_value": 0.70,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 6,
        "source": "United Nations Department of Economic and Social Affairs",
        "source_url": "https://publicadministration.un.org/egovkb",
        "unit": "index (0–1)",
        "metadata": {
            "notes": "Nepal scored 0.4948 in 2024 EGDI (ranked 103rd globally). "
            "Target 0.70 requires digital infrastructure expansion from bp-004, bp-009."
        },
    },
    {
        "indicator_name": "government_services_online_pct",
        "indicator_label": "Core Government Services Fully Available Online (%)",
        "category": "governance",
        "priority_area": "pp-001",
        "ministry": "Communication and Information",
        "baseline_value": 15.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 15.0,
        "measured_date": CURRENT_DATE,
        "target_value": 100.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 7,
        "source": "Ministry of Communication and Information Technology",
        "source_url": "https://mocit.gov.np",
        "unit": "%",
        "metadata": {
            "notes": "Estimate based on MoCIT portal data. ~150 of ~1,000 core services "
            "are fully online as of March 2026. bp-004 target: end all middlemen. "
            "Updated quarterly from MoCIT reports."
        },
    },
    {
        "indicator_name": "federal_ministries_count",
        "indicator_label": "Number of Federal Ministries (lower = leaner govt)",
        "category": "governance",
        "priority_area": "pp-001",
        "ministry": "General Administration",
        "baseline_value": 25.0,  # Outgoing coalition had ~25 portfolios
        "baseline_date": BASELINE_DATE,
        "current_value": 15.0,  # RSP cabinet: 15 ministers from day one (April 2026)
        "measured_date": CURRENT_DATE,
        "target_value": 18.0,  # bp-017: limit to 18 federal ministries
        "target_deadline": TARGET_DATE,
        "direction": "lower_is_better",
        "weight": 4,
        "source": "Prime Minister's Office Nepal",
        "source_url": "https://pmo.gov.np",
        "unit": "count",
        "metadata": {
            "notes": "Outgoing coalition govt had 25 portfolios. RSP immediately reduced "
            "to 15 on March 27 2026 — already exceeds the target of ≤18 (bp-017). "
            "Progress is clamped at 100% since target is already surpassed."
        },
    },
    # ═══════════════════════════════════════════════════════════════════════════
    # pp-002: MIDDLE-CLASS EXPANSION
    # Karar Patra goal: 7% GDP growth; per capita ≥ $3,000; economy $100B;
    # 100% insured health; radical education reform; integrated social security;
    # universal financial inclusion; end usurious lending (meter byaj)
    # Bachha Patra items: bp-019 → bp-060 (42 items)
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "indicator_name": "gdp_per_capita_current_usd",
        "indicator_label": "GDP Per Capita (Current USD)",
        "category": "economy",
        "priority_area": "pp-002",
        "ministry": "Finance",
        "baseline_value": 1470.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 1472.0,  # Dummy: NRB Q4 FY2025/26 estimate, awaiting CBS confirmation
        "measured_date": CURRENT_DATE,
        "target_value": 3000.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 10,
        "source": "World Bank / Nepal Rastra Bank",
        "source_url": "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD?locations=NP",
        "unit": "USD",
        "metadata": {
            "notes": "World Bank 2024 estimate. NRB updates quarterly. "
            "Manifesto target $3,000 requires doubling in 5 years. "
            "April value is a preliminary NRB Q4 FY2025/26 projection (dummy)."
        },
    },
    {
        "indicator_name": "gdp_nominal_billion_usd",
        "indicator_label": "Total Nominal GDP (USD Billions)",
        "category": "economy",
        "priority_area": "pp-002",
        "ministry": "Finance",
        "baseline_value": 42.5,
        "baseline_date": BASELINE_DATE,
        "current_value": 42.6,  # Dummy: quarterly NRB data
        "measured_date": CURRENT_DATE,
        "target_value": 100.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 9,
        "source": "World Bank / Nepal Rastra Bank",
        "source_url": "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD?locations=NP",
        "unit": "billion USD",
        "metadata": {
            "notes": "NRB FY2024/25 estimate. $100B economy target from karar patra. "
            "Requires 2.4× growth in 5 years — achievable only with 7%+ annual growth."
        },
    },
    {
        "indicator_name": "gdp_real_growth_rate_pct",
        "indicator_label": "Annual Real GDP Growth Rate (Constant Prices, %)",
        "category": "economy",
        "priority_area": "pp-002",
        "ministry": "Finance",
        "baseline_value": 3.9,
        "baseline_date": BASELINE_DATE,
        "current_value": 3.9,  # CBS FY2023/24 actual — awaiting FY2024/25 final
        "measured_date": BASELINE_DATE,
        "target_value": 7.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 9,
        "source": "Central Bureau of Statistics Nepal",
        "source_url": "https://cbs.gov.np",
        "unit": "%",
        "metadata": {
            "notes": "CBS FY2023/24 preliminary estimate: 3.9%. "
            "FY2024/25 CBS projection: ~5.0% (not confirmed). "
            "Target 7% annual (constant prices) per karar patra."
        },
    },
    {
        "indicator_name": "poverty_headcount_ratio_pct",
        "indicator_label": "National Poverty Headcount Ratio (%)",
        "category": "economy",
        "priority_area": "pp-002",
        "ministry": "Finance",
        "baseline_value": 20.3,
        "baseline_date": BASELINE_DATE,
        "current_value": 20.3,  # CBS 2023 — next household survey expected FY2026/27
        "measured_date": BASELINE_DATE,
        "target_value": 10.0,
        "target_deadline": TARGET_DATE,
        "direction": "lower_is_better",
        "weight": 8,
        "source": "Central Bureau of Statistics / World Bank",
        "source_url": "https://data.worldbank.org/indicator/SI.POV.NAHC?locations=NP",
        "unit": "%",
        "metadata": {
            "notes": "CBS Nepal Living Standards Survey 2022/23: 20.3% below national poverty line. "
            "Target 10% implies halving poverty — consistent with middle-income goals.",
            "ministries": [
                "Labour, Employment and Social Security",
                "Agriculture and Livestock",
            ],
        },
    },
    {
        "indicator_name": "health_insurance_coverage_pct",
        "indicator_label": "Population with Health Insurance Coverage (%)",
        "category": "health",
        "priority_area": "pp-002",
        "ministry": "Health and Drinking Water",
        "baseline_value": 18.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 18.0,  # HIB Annual Report 2024 — quarterly updates
        "measured_date": BASELINE_DATE,
        "target_value": 100.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 7,
        "source": "Health Insurance Board Nepal",
        "source_url": "https://hib.gov.np",
        "unit": "%",
        "metadata": {
            "notes": "HIB 2024 Annual Report: ~18% of population enrolled. "
            "100% coverage target requires 5.5× expansion in 5 years. "
            "Needs both premium subsidy and mandatory employer contribution reforms."
        },
    },
    {
        "indicator_name": "adults_with_bank_account_pct",
        "indicator_label": "Adults (15+) with Formal Bank Account (%)",
        "category": "economy",
        "priority_area": "pp-002",
        "ministry": "Finance",
        "baseline_value": 55.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 55.0,  # NRB BFI data 2024
        "measured_date": BASELINE_DATE,
        "target_value": 95.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 5,
        "source": "Nepal Rastra Bank / World Bank Global Findex",
        "source_url": "https://www.worldbank.org/en/publication/globalfindex",
        "unit": "%",
        "metadata": {
            "notes": "NRB BFI quarterly data: ~55% adults hold formal accounts (2024). "
            "Karar patra target: universal financial inclusion. "
            "bp-030, bp-031 cover cooperative and microfinance regulation."
        },
    },
    {
        "indicator_name": "consumer_price_inflation_pct",
        "indicator_label": "Annual Consumer Price Inflation (%)",
        "category": "economy",
        "priority_area": "pp-002",
        "ministry": "Finance",
        "baseline_value": 5.5,
        "baseline_date": BASELINE_DATE,
        "current_value": 5.4,  # NRB Economic Bulletin Mar 2026 (dummy — final not published)
        "measured_date": CURRENT_DATE,
        "target_value": 4.0,
        "target_deadline": TARGET_DATE,
        "direction": "lower_is_better",
        "weight": 6,
        "source": "Nepal Rastra Bank",
        "source_url": "https://www.nrb.org.np/category/economic-bulletin/",
        "unit": "%",
        "metadata": {
            "notes": "NRB monthly bulletin. Nepal's 12-month average CPI ~5.5% as of Feb 2026. "
            "Target 4% is consistent with price stability for middle-class purchasing power. "
            "Linked to bp-021, bp-022 (stable monetary and fiscal environment)."
        },
    },
    {
        "indicator_name": "gross_national_savings_pct_gdp",
        "indicator_label": "Gross National Savings as % of GDP",
        "category": "economy",
        "priority_area": "pp-002",
        "ministry": "Finance",
        "baseline_value": 10.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 10.0,  # NRB / CBS estimate
        "measured_date": BASELINE_DATE,
        "target_value": 20.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 4,
        "source": "Nepal Rastra Bank / CBS",
        "source_url": "https://www.nrb.org.np",
        "unit": "% of GDP",
        "metadata": {
            "notes": "Nepal's low domestic savings (~10% of GDP) is a structural constraint "
            "on investment-led growth. Target 20% aligned with comparative middle-income countries."
        },
    },
    # ═══════════════════════════════════════════════════════════════════════════
    # pp-003: JOBS, JOBS, JOBS
    # Karar Patra goal: 500,000 new formal jobs; reduce forced migration;
    # Priority: IT, construction, tourism, agriculture, minerals, industry, service trade
    # Bachha Patra items: bp-061 → bp-080 (20 items)
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "indicator_name": "formal_jobs_created_cumulative",
        "indicator_label": "Cumulative New Formal Jobs Created Since March 2026",
        "category": "labor",
        "priority_area": "pp-003",
        "ministry": "Labour, Employment and Social Security",
        "baseline_value": 0,
        "baseline_date": BASELINE_DATE,
        "current_value": 0,  # April 2, 2026: too early for any official count
        "measured_date": CURRENT_DATE,
        "target_value": 500000,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 10,
        "source": "Ministry of Labour, Employment and Social Security / CBS",
        "source_url": "https://moless.gov.np",
        "unit": "jobs",
        "metadata": {
            "notes": "Core karar patra target: 500,000 new formal, dignified jobs. "
            "CBS defines formal employment as social-security covered. "
            "MoLESS publishes quarterly employment surveys. Baseline: 0 new jobs since govt formation.",
            "ministries": [
                "Prime Minister, Defence, and Industry",
                "Agriculture and Livestock",
                "Tourism",
            ],
        },
    },
    {
        "indicator_name": "unemployment_rate_pct",
        "indicator_label": "Unemployment Rate — ILO Definition (%)",
        "category": "labor",
        "priority_area": "pp-003",
        "ministry": "Labour, Employment and Social Security",
        "baseline_value": 11.4,
        "baseline_date": BASELINE_DATE,
        "current_value": 11.4,  # CBS Labour Force Survey — annual
        "measured_date": BASELINE_DATE,
        "target_value": 5.0,
        "target_deadline": TARGET_DATE,
        "direction": "lower_is_better",
        "weight": 8,
        "source": "Central Bureau of Statistics / ILO",
        "source_url": "https://ilostat.ilo.org/data/country-profiles/NP/",
        "unit": "%",
        "metadata": {
            "notes": "CBS Nepal Labour Force Survey 2023 (latest): 11.4% ILO definition. "
            "Includes broad unemployment; youth rate ~14.8%. "
            "Target 5% is ambitious but consistent with 500k jobs goal.",
            "ministries": ["Education, Science and Technology"],
        },
    },
    {
        "indicator_name": "daily_foreign_employment_departures",
        "indicator_label": "Average Daily Departures for Foreign Employment (people/day)",
        "category": "labor",
        "priority_area": "pp-003",
        "ministry": "Labour, Employment and Social Security",
        "baseline_value": 3300,
        "baseline_date": BASELINE_DATE,
        "current_value": 3250,  # Dummy: minor reduction, DoFE Mar 2026 weekly data
        "measured_date": CURRENT_DATE,
        "target_value": 1500,
        "target_deadline": TARGET_DATE,
        "direction": "lower_is_better",
        "weight": 7,
        "source": "Department of Foreign Employment Nepal",
        "source_url": "https://dofe.gov.np",
        "unit": "people/day",
        "metadata": {
            "notes": "Karar patra states 3,300+ daily youth migration (current situation). "
            "DoFE publishes weekly departure data. Target 1,500/day = 45% reduction. "
            "Requires both job creation domestically and safe-return programs.",
            "ministries": ["Foreign Affairs"],
        },
    },
    {
        "indicator_name": "it_exports_nrs_billion_annual",
        "indicator_label": "Annual IT and Software Exports (NPR Billion)",
        "category": "economy",
        "priority_area": "pp-003",
        "ministry": "Education, Science and Technology",
        "baseline_value": 12.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 12.0,  # NRB FY2023/24 — annual data
        "measured_date": BASELINE_DATE,
        "target_value": 50.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 6,
        "source": "Nepal Rastra Bank",
        "source_url": "https://www.nrb.org.np",
        "unit": "NPR billion",
        "metadata": {
            "notes": "NRB FY2023/24 electronic/software services exports. "
            "Goals 2087: IT exports > Rs 50B/year. Requires 4× growth in 5 years. "
            "Nepal IT sector currently growing ~25% annually.",
            "ministries": [
                "Communication and Information",
                "Prime Minister, Defence, and Industry",
            ],
        },
    },
    {
        "indicator_name": "international_tourist_arrivals_thousands_annual",
        "indicator_label": "Annual International Tourist Arrivals (Thousands)",
        "category": "economy",
        "priority_area": "pp-003",
        "ministry": "Tourism",
        "baseline_value": 1050,
        "baseline_date": BASELINE_DATE,
        "current_value": 1050,  # Nepal Tourism Board FY2024/25 estimate
        "measured_date": BASELINE_DATE,
        "target_value": 2000,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 5,
        "source": "Nepal Tourism Board",
        "source_url": "https://www.tourism.gov.np",
        "unit": "thousands/year",
        "metadata": {
            "notes": "Nepal Tourism Board: ~1.0–1.1M arrivals in 2024. "
            "2M target requires ~14% annual growth — consistent with investment in "
            "infrastructure and simplified visa for priority markets."
        },
    },
    {
        "indicator_name": "vocational_skill_graduates_annual",
        "indicator_label": "Annual TVET / Vocational Skill Certificate Graduates",
        "category": "education",
        "priority_area": "pp-003",
        "ministry": "Education, Science and Technology",
        "baseline_value": 85000,
        "baseline_date": BASELINE_DATE,
        "current_value": 85000,  # CTEVT Annual Report 2024
        "measured_date": BASELINE_DATE,
        "target_value": 400000,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 4,
        "source": "CTEVT / Ministry of Education Science and Technology",
        "source_url": "https://ctevt.org.np",
        "unit": "graduates/year",
        "metadata": {
            "notes": "CTEVT 2024 Annual Report: ~85k technical graduates. "
            "Goals 2087 target: every Class 12 graduate gets vocational skill certificate. "
            "400k target based on ~350k Class 12 graduates annually."
        },
    },
    # ═══════════════════════════════════════════════════════════════════════════
    # pp-004: CONNECTIVITY
    # Karar Patra goal: 15,000 MW installed capacity; 30,000 km national highways;
    # high-speed internet to all settlements; 10 signature projects completed
    # Bachha Patra items: bp-081 → bp-095 (15 items)
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "indicator_name": "installed_electricity_capacity_mw",
        "indicator_label": "Total Installed Electricity Capacity (MW)",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "ministry": "Energy",
        "baseline_value": 3100,
        "baseline_date": BASELINE_DATE,
        "current_value": 3140,  # Dummy: minor new additions in Mar-Apr 2026
        "measured_date": CURRENT_DATE,
        "target_value": 15000,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 10,
        "source": "Nepal Electricity Authority",
        "source_url": "https://www.nea.org.np",
        "unit": "MW",
        "metadata": {
            "notes": "NEA Annual Report 2023/24: ~2,900 MW operational capacity. "
            "With Upper Tamakoshi and recent solar additions, ~3,100 MW by March 2026. "
            "15,000 MW target requires 4.8× growth — requires IPP investment acceleration."
        },
    },
    {
        "indicator_name": "domestic_electricity_consumption_peak_mw",
        "indicator_label": "Peak Domestic Electricity Demand / Consumption (MW)",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "ministry": "Energy",
        "baseline_value": 1500,
        "baseline_date": BASELINE_DATE,
        "current_value": 1510,  # Dummy: NEA weekly system load data
        "measured_date": CURRENT_DATE,
        "target_value": 5000,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 7,
        "source": "Nepal Electricity Authority",
        "source_url": "https://www.nea.org.np",
        "unit": "MW",
        "metadata": {
            "notes": "NEA system peak demand ~1,500 MW (2025). "
            "Goals 2087: 5,000 MW domestic consumption (reduction in LPG; EV uptake). "
            "Growing demand is a POSITIVE indicator — reflects electrification progress."
        },
    },
    {
        "indicator_name": "national_highway_km",
        "indicator_label": "Total National Highway Network Length (km)",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "ministry": "Physical Infrastructure",
        "baseline_value": 13800,
        "baseline_date": BASELINE_DATE,
        "current_value": 13830,  # Dummy: DoR monthly completion data
        "measured_date": CURRENT_DATE,
        "target_value": 30000,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 9,
        "source": "Department of Roads Nepal",
        "source_url": "https://dor.gov.np",
        "unit": "km",
        "metadata": {
            "notes": "DoR Strategic Road Network 2023: ~13,700 km. "
            "With FY2024/25 additions estimated at ~13,800 km by March 2026. "
            "30,000 km target requires doubling in 5 years — extremely ambitious; "
            "historically DoR adds ~400–800 km/year."
        },
    },
    {
        "indicator_name": "internet_users_pct_population",
        "indicator_label": "Internet Users as % of Population",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "ministry": "Communication and Information",
        "baseline_value": 72.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 72.3,  # Dummy: NTA Q4 FY2025/26 quarterly data
        "measured_date": CURRENT_DATE,
        "target_value": 98.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 7,
        "source": "Nepal Telecommunications Authority",
        "source_url": "https://nta.gov.np",
        "unit": "%",
        "metadata": {
            "notes": "NTA quarterly bulletin: ~72% of population with internet access (FY2024/25). "
            "Target 98% = universal connectivity per karar patra. "
            "Last-mile rural connectivity is the key bottleneck."
        },
    },
    {
        "indicator_name": "signature_projects_completed_count",
        "indicator_label": "National Signature Projects Completed (Count)",
        "category": "infrastructure",
        "priority_area": "pp-004",
        "ministry": "Prime Minister, Defence, and Industry",
        "baseline_value": 0,
        "baseline_date": BASELINE_DATE,
        "current_value": 0,  # Too early; projects not yet designated
        "measured_date": CURRENT_DATE,
        "target_value": 10,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 5,
        "source": "National Planning Commission Nepal",
        "source_url": "https://npc.gov.np",
        "unit": "projects completed",
        "metadata": {
            "notes": "10 'signature projects of national importance' per karar patra. "
            "Projects not yet formally designated by NPC as of April 2026. "
            "Updated when NPC publishes official signature project list.",
            "ministries": ["Physical Infrastructure", "Energy"],
        },
    },
    {
        "indicator_name": "kathmandu_pm25_annual_mean_ug_m3",
        "indicator_label": "Kathmandu Valley Annual Mean PM2.5 (μg/m³)",
        "category": "environment",
        "priority_area": "pp-004",
        "ministry": "Physical Infrastructure",
        "baseline_value": 75.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 70.0,  # Spring seasonal improvement (Apr); dummy
        "measured_date": CURRENT_DATE,
        "target_value": 37.5,  # Goals 2087: 50% reduction → from 75 to 37.5
        "target_deadline": TARGET_DATE,
        "direction": "lower_is_better",
        "weight": 4,
        "source": "US Embassy Kathmandu AQI / ICIMOD",
        "source_url": "https://aqicn.org/city/kathmandu/",
        "unit": "μg/m³ (annual average)",
        "metadata": {
            "notes": "US Embassy AQI data: Kathmandu annual average PM2.5 ~75 μg/m³ (2024/25). "
            "WHO guideline: 5 μg/m³; Nepal interim target: reduce 50% from baseline. "
            "Spring is naturally cleaner (seasonal); annual average is the tracked metric.",
            "ministries": ["Energy"],
        },
    },
    # ═══════════════════════════════════════════════════════════════════════════
    # pp-005: DIASPORA
    # Karar Patra goal: online voting for Nepalis abroad; citizenship for descendants;
    # sovereign diaspora fund; safe investment + dignified return; decent foreign employment
    # Bachha Patra items: bp-096 → bp-100 (5 items)
    # ═══════════════════════════════════════════════════════════════════════════
    {
        "indicator_name": "diaspora_online_voting_implemented",
        "indicator_label": "Online Voting for Overseas Nepalis Implemented (0=No, 1=Yes)",
        "category": "foreign_policy",
        "priority_area": "pp-005",
        "ministry": "Foreign Affairs",
        "baseline_value": 0,
        "baseline_date": BASELINE_DATE,
        "current_value": 0,
        "measured_date": CURRENT_DATE,
        "target_value": 1,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 8,
        "source": "Election Commission Nepal",
        "source_url": "https://election.gov.np",
        "unit": "boolean (0 = not yet / 1 = implemented)",
        "metadata": {
            "notes": "Core bp-096 commitment. Requires constitutional amendment and "
            "Election Commission Act revision. No legislation introduced as of April 2026. "
            "Binary indicator: 0 until system is live for an actual election.",
            "ministries": ["Law, Justice and Parliamentary Affairs"],
        },
    },
    {
        "indicator_name": "sovereign_diaspora_fund_nrs_billion",
        "indicator_label": "Sovereign Diaspora Fund Corpus (NPR Billion)",
        "category": "foreign_policy",
        "priority_area": "pp-005",
        "ministry": "Foreign Affairs",
        "baseline_value": 0.0,
        "baseline_date": BASELINE_DATE,
        "current_value": 0.0,
        "measured_date": CURRENT_DATE,
        "target_value": 50.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 7,
        "source": "NRB / Ministry of Finance",
        "source_url": "https://mof.gov.np",
        "unit": "NPR billion",
        "metadata": {
            "notes": "bp-097: sovereign diaspora fund to channel remittances into productive investment. "
            "No legislation or fund established as of April 2026. "
            "Target NPR 50B corpus over 5 years. Updated when fund is legally established.",
            "ministries": ["Finance"],
        },
    },
    {
        "indicator_name": "remittance_to_gdp_ratio_pct",
        "indicator_label": "Annual Remittance Inflows as % of GDP (lower = less dependency)",
        "category": "foreign_policy",
        "priority_area": "pp-005",
        "ministry": "Foreign Affairs",
        "baseline_value": 22.7,
        "baseline_date": BASELINE_DATE,
        "current_value": 22.7,  # NRB FY2023/24 annual — quarterly updates
        "measured_date": BASELINE_DATE,
        "target_value": 15.0,
        "target_deadline": TARGET_DATE,
        "direction": "lower_is_better",
        "weight": 6,
        "source": "Nepal Rastra Bank",
        "source_url": "https://www.nrb.org.np",
        "unit": "% of GDP",
        "metadata": {
            "notes": "NRB FY2023/24: remittances ≈ NPR 1.27T on GDP of NPR 5.58T = 22.7%. "
            "Falling remittance dependency reflects success in domestic job creation. "
            "Target 15% requires both GDP growth AND domestic employment growth.",
            "ministries": ["Labour, Employment and Social Security"],
        },
    },
    {
        "indicator_name": "foreign_employment_welfare_fund_nrs_billion",
        "indicator_label": "Foreign Employment Welfare Fund Corpus (NPR Billion)",
        "category": "labor",
        "priority_area": "pp-005",
        "ministry": "Labour, Employment and Social Security",
        "baseline_value": 5.2,
        "baseline_date": BASELINE_DATE,
        "current_value": 5.2,  # DoFE 2024 annual report
        "measured_date": BASELINE_DATE,
        "target_value": 20.0,
        "target_deadline": TARGET_DATE,
        "direction": "higher_is_better",
        "weight": 3,
        "source": "Department of Foreign Employment Nepal",
        "source_url": "https://dofe.gov.np",
        "unit": "NPR billion",
        "metadata": {
            "notes": "DoFE 2024: Foreign Employment Welfare Fund ~NPR 5.2B. "
            "Expansion linked to bp-098 (decent foreign employment, worker protections). "
            "Updated from DoFE annual reports / semi-annual releases.",
            "ministries": ["Foreign Affairs"],
        },
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# SEEDING LOGIC
# ─────────────────────────────────────────────────────────────────────────────


def get_manifesto_item_uuid(source_id: str) -> str | None:
    """Look up the UUID of a manifesto_item by its source_id (e.g. 'pp-001')."""
    result = (
        db.table("manifesto_items")
        .select("id")
        .eq("source_id", source_id)
        .limit(1)
        .execute()
    )
    return result.data[0]["id"] if result.data else None


def seed_indicators():
    logger.info(
        f"Seeding {len(INDICATORS)} outcome indicators (v1 — outcome-only model)..."
    )

    # Pre-fetch manifesto_item UUIDs for all priority areas
    priority_area_ids: dict[str, str | None] = {}
    for ind in INDICATORS:
        pa = ind.get("priority_area")
        if pa and pa not in priority_area_ids:
            priority_area_ids[pa] = get_manifesto_item_uuid(pa)
            if priority_area_ids[pa]:
                logger.info(f"  Resolved {pa} → {priority_area_ids[pa][:8]}...")
            else:
                logger.warning(f"  Could not resolve manifesto_item UUID for {pa}")

    rows = []
    for ind in INDICATORS:
        row = {**ind}
        pa = row.get("priority_area")
        if pa:
            row["manifesto_item_id"] = priority_area_ids.get(pa)
        if "metadata" not in row:
            row["metadata"] = {}
        rows.append(row)

    # Upsert by indicator_name (requires UNIQUE constraint from migration 009)
    result = (
        db.table("outcome_indicators")
        .upsert(rows, on_conflict="indicator_name")
        .execute()
    )
    logger.info(f"Seeded {len(result.data)} outcome indicators")

    # Log summary by priority area
    by_area: dict[str, list] = {}
    for ind in rows:
        pa = ind.get("priority_area", "unknown")
        by_area.setdefault(pa, []).append(ind["indicator_name"])

    for pa in sorted(by_area.keys()):
        logger.info(f"  {pa}: {len(by_area[pa])} indicators — {', '.join(by_area[pa])}")

    return result.data


if __name__ == "__main__":
    seed_indicators()
