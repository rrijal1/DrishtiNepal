#!/usr/bin/env python3
"""
Comprehensive demo seed for Drishti Nepal.

Seeds:
  1. All 100 manifesto items (bp-001 … bp-100) from bachha_patra.json
  2. One result indicator + one process indicator per bp item
  3. Score history (4 monthly snapshots) for each active minister
  4. Updates minister overall_score with realistic values

Run:
    python scripts/seed_demo_data.py

Requires DATABASE_URL (or SUPABASE_URL + SUPABASE_SERVICE_KEY) in .env (root).
"""

import json, os, sys, uuid
from pathlib import Path
from datetime import date, timedelta

ROOT = Path(__file__).resolve().parent.parent

# ── Load .env ─────────────────────────────────────────────────────────────────
for line in (ROOT / ".env").read_text().splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    sys.exit("Missing DATABASE_URL in .env")

import psycopg2
import psycopg2.extras

GOVT_FORMATION = date(2026, 3, 27)
TODAY = date(2026, 4, 18)

# ── Category normaliser ───────────────────────────────────────────────────────
CATEGORY_MAP = {
    "governance": "governance", "economy": "economy", "health": "health",
    "education": "education", "infrastructure": "infrastructure", "labor": "labor",
    "foreign_policy": "foreign_policy", "environment": "environment",
    "social_justice": "governance", "justice": "governance", "technology": "economy",
    "agriculture": "economy", "energy": "infrastructure", "tourism": "economy",
    "sports": "education", "diaspora": "foreign_policy", "finance": "economy",
    "trade": "economy", "water": "infrastructure", "transport": "infrastructure",
    "housing": "infrastructure", "digitalization": "economy", "judiciary": "governance",
    "media": "governance", "local": "governance", "federalism": "governance",
}

PRIORITY_MAP = {"critical": "high", "high": "high", "important": "high",
                "medium": "medium", "normal": "medium", "low": "low"}

def bp_to_pp(n: int) -> str:
    if n <= 18: return "pp-001"
    if n <= 60: return "pp-002"
    if n <= 80: return "pp-003"
    if n <= 95: return "pp-004"
    return "pp-005"

# ── Minister data ─────────────────────────────────────────────────────────────
MINISTER_SCORES = {
    "6cfbf12a-d45f-4e65-9975-f2f23aba0a46": ("Balendra Shah",          26, ["pp-001","pp-002"]),
    "70f63fa7-394b-4719-b5d7-ecfef7c1f461": ("Biraj Bhakta Shrestha", 18, ["pp-004"]),
    "f5bc3eba-d2d9-4186-9121-a7189dbe00c4": ("Dr. Bikram Timilsina",  14, ["pp-002","pp-004"]),
    "b0b96ac2-3096-4d30-9a55-6b25181be0a6": ("Dr. Swarnim Wagle",     22, ["pp-002","pp-003"]),
    "67933680-a2f5-40c6-9b7a-86ef6d61b8d2": ("Gauri Kumari Yadav",   11, ["pp-002","pp-003"]),
    "b3316dc8-ba2a-46b8-8de3-35fb4b8a8cd9": ("Geeta Chaudhary",       9, ["pp-002"]),
    "62bfeb7d-a3ad-46f1-8d2e-b35448373e51": ("Khadak Raj Poudel",    12, ["pp-003"]),
    "7353bcee-9503-48b3-9f70-75d425546ac5": ("Nisha Mehta",           15, ["pp-002"]),
    "300a5254-e758-40b4-9ac3-3b2f8e36c5e1": ("Pratibha Rawal",        8, ["pp-001"]),
    "8d5b038e-2ff9-4572-8f9f-6cac22fd345b": ("Ramjee Yadav",          6, ["pp-003"]),
    "162c56d3-c78f-4860-b9bc-e06e8e249dc8": ("Sasmit Pokharel",      13, ["pp-002"]),
    "6907a980-0c29-48fb-89b9-5dd3d27773a4": ("Shishir Khanal",       10, ["pp-005"]),
    "87e44bf7-d16a-417d-b7a0-6c595b509e21": ("Sita Badi",             7, ["pp-002"]),
    "3f45dbe1-d543-4be4-acf5-0f3d0e12ef50": ("Sobita Gautam",        16, ["pp-001"]),
    "ff28fcf8-b8a5-46a9-801c-aac89e57f5d3": ("Sudan Gurung",         20, ["pp-001"]),
    "767152c8-44df-4396-8b3d-39c869f33018": ("Sunil Lamsal",         17, ["pp-004"]),
}

ITEM_STATUS = {
    1: "in_progress", 2: "in_progress", 3: "in_progress",
    7: "partially_fulfilled", 21: "partially_fulfilled",
    34: "in_progress", 63: "in_progress", 81: "in_progress",
}

AREA_INDICATOR_TEMPLATE = {
    "pp-001": {"label": "Anti-Corruption Enforcement Actions", "unit": "cases initiated",
               "baseline": 12.0, "target": 200.0, "pct": 0.08, "direction": "higher_is_better",
               "source": "CIAA Nepal", "weight": 3},
    "pp-002": {"label": "GDP Growth Rate", "unit": "% annual",
               "baseline": 3.9, "target": 7.0, "pct": 0.05, "direction": "higher_is_better",
               "source": "Nepal Rastra Bank", "weight": 3},
    "pp-003": {"label": "Formal Jobs Created", "unit": "headcount",
               "baseline": 0.0, "target": 500000.0, "pct": 0.02, "direction": "higher_is_better",
               "source": "Dept of Labour", "weight": 3},
    "pp-004": {"label": "Installed Power Generation Capacity", "unit": "MW",
               "baseline": 3000.0, "target": 15000.0, "pct": 0.03, "direction": "higher_is_better",
               "source": "NEA Annual Report 2081/82", "weight": 2},
    "pp-005": {"label": "Diaspora Policy Milestones Completed", "unit": "milestones",
               "baseline": 0.0, "target": 10.0, "pct": 0.10, "direction": "higher_is_better",
               "source": "Ministry of Foreign Affairs", "weight": 2},
}

MINISTER_BP_RANGES: dict[str, list[int]] = {
    "6cfbf12a-d45f-4e65-9975-f2f23aba0a46": list(range(1, 6)),
    "ff28fcf8-b8a5-46a9-801c-aac89e57f5d3": list(range(1, 10)),
    "3f45dbe1-d543-4be4-acf5-0f3d0e12ef50": list(range(5, 15)),
    "300a5254-e758-40b4-9ac3-3b2f8e36c5e1": list(range(10, 18)),
    "b0b96ac2-3096-4d30-9a55-6b25181be0a6": list(range(19, 35)),
    "67933680-a2f5-40c6-9b7a-86ef6d61b8d2": list(range(25, 45)),
    "b3316dc8-ba2a-46b8-8de3-35fb4b8a8cd9": list(range(40, 55)),
    "7353bcee-9503-48b3-9f70-75d425546ac5": list(range(50, 60)),
    "162c56d3-c78f-4860-b9bc-e06e8e249dc8": list(range(55, 65)),
    "8d5b038e-2ff9-4572-8f9f-6cac22fd345b": list(range(61, 75)),
    "62bfeb7d-a3ad-46f1-8d2e-b35448373e51": list(range(65, 78)),
    "f5bc3eba-d2d9-4186-9121-a7189dbe00c4": list(range(73, 82)),
    "70f63fa7-394b-4719-b5d7-ecfef7c1f461": list(range(81, 90)),
    "767152c8-44df-4396-8b3d-39c869f33018": list(range(85, 95)),
    "87e44bf7-d16a-417d-b7a0-6c595b509e21": list(range(50, 62)),
    "6907a980-0c29-48fb-89b9-5dd3d27773a4": list(range(96, 101)),
}

def process_status_for(bp_num: int) -> str:
    if bp_num in (1, 2, 3, 4, 7, 21, 34, 35, 40, 63, 81): return "ongoing"
    return "not_started"


def main():
    bp_data = json.loads((ROOT / "data/manifesto/bachha_patra.json").read_text())
    foundations: list[dict] = bp_data["foundations"]

    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # ─── 1. Upsert 100 manifesto items ───────────────────────────────────────
    print("Seeding manifesto_items (100 bp items)...")
    for f in foundations:
        num = f["number"]
        cat = CATEGORY_MAP.get(f.get("category", "governance"), "governance")
        pri = PRIORITY_MAP.get(f.get("priority", "medium"), "medium")
        kc = f.get("key_commitments", [])
        title_en = f["title_en"]
        item_text = title_en + (". " + "; ".join(kc[:3]) if kc else "")
        status = ITEM_STATUS.get(num, "not_started")

        cur.execute("""
            INSERT INTO manifesto_items
                (source_id, document_type, category, item_text_en, item_text_np,
                 title_en, title_np, priority, status, key_commitments, measurable)
            VALUES (%s, 'bachha_patra', %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s)
            ON CONFLICT (source_id) DO UPDATE SET
                title_en = EXCLUDED.title_en,
                status   = EXCLUDED.status
        """, (f["id"], cat, item_text, title_en, title_en, title_en,
              pri, status, json.dumps(kc), f.get("measurable", True)))
    conn.commit()

    # Build bp source_id → uuid
    cur.execute("SELECT source_id, id FROM manifesto_items WHERE source_id LIKE 'bp-%'")
    bp_uuid: dict[str, str] = {r[0]: str(r[1]) for r in cur.fetchall()}
    print(f"  {len(bp_uuid)} manifesto items in DB")

    # Get bachha_patra source FK
    cur.execute("SELECT id FROM sources WHERE slug = 'bachha_patra'")
    row = cur.fetchone()
    bp_source_id = str(row[0]) if row else None

    # ─── 2. Delete existing outcome_indicators ────────────────────────────────
    print("\nRemoving old outcome_indicators...")
    cur.execute("DELETE FROM outcome_indicators")
    conn.commit()

    # ─── 3. Seed result + process indicators ─────────────────────────────────
    print("Seeding outcome_indicators (200 rows: 100 result + 100 process)...")
    indicator_rows = []
    result_ind_by_bp: dict[str, str] = {}  # bp_key → result indicator id

    for f in foundations:
        num = f["number"]
        bp_id = bp_uuid.get(f["id"])
        if not bp_id:
            continue

        pp = bp_to_pp(num)
        tmpl = AREA_INDICATOR_TEMPLATE[pp]
        cat = CATEGORY_MAP.get(f.get("category", "governance"), "governance")

        noise = (((num * 17) % 11) - 5) / 100.0
        pct = max(0.0, min(0.25, tmpl["pct"] + noise))
        baseline = tmpl["baseline"]
        target = tmpl["target"]
        current = round(baseline + (target - baseline) * pct, 2)

        # Result indicator
        result_id = str(uuid.uuid4())
        result_ind_by_bp[f["id"]] = result_id
        indicator_rows.append((
            result_id,
            f"bp{num:03d}_result_{pp.replace('-','')}",
            f"{tmpl['label']} \u2014 bp-{num:03d}",
            cat, pp, bp_id,
            baseline, GOVT_FORMATION.isoformat(), target, "2031-03-27",
            current, tmpl["unit"], tmpl["direction"],
            tmpl["source"], tmpl["weight"],
            "result", None, None,       # indicator_type, process_status, parent_indicator_id
            bp_source_id,
        ))

        # Process indicator
        proc_id = str(uuid.uuid4())
        proc_status = process_status_for(num)
        indicator_rows.append((
            proc_id,
            f"bp{num:03d}_process_policy",
            f"Policy/Implementation Status \u2014 bp-{num:03d}",
            cat, pp, bp_id,
            None, None, None, None,
            None, "",    # unit = "" (NOT NULL default)
            "higher_is_better",  # direction NOT NULL default
            "PM Office / Line Ministry", 1,
            "process", proc_status, result_id,  # parent = result indicator
            bp_source_id,
        ))

    cur.executemany("""
        INSERT INTO outcome_indicators
            (id, indicator_name, indicator_label, category, priority_area, manifesto_item_id,
             baseline_value, baseline_date, target_value, target_deadline,
             current_value, unit, direction, source, weight,
             indicator_type, process_status, parent_indicator_id, source_id)
        VALUES (%s,%s,%s,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s,%s,%s, %s,%s,%s,%s)
        ON CONFLICT (indicator_name) DO NOTHING
    """, indicator_rows)
    conn.commit()
    print(f"  Inserted {len(indicator_rows)} indicator rows")

    # ─── 4. Assign indicators to ministers ───────────────────────────────────
    print("\nAssigning indicators to ministers...")
    count = 0
    for minister_id, bp_nums in MINISTER_BP_RANGES.items():
        for bp_num in bp_nums:
            bp_key = f"bp-{bp_num:03d}"
            cur.execute(
                "UPDATE outcome_indicators SET minister_id = %s WHERE manifesto_item_id = %s",
                (minister_id, bp_uuid.get(bp_key))
            )
            count += 1
    conn.commit()
    print(f"  Updated indicators for {count} bp-minister assignments")

    # ─── 5. Score history ─────────────────────────────────────────────────────
    print("\nSeeding score history...")
    cur.execute("DELETE FROM scores")
    snapshot_dates = [
        GOVT_FORMATION,
        GOVT_FORMATION + timedelta(days=7),
        GOVT_FORMATION + timedelta(days=14),
        TODAY,
    ]
    score_rows = []
    for minister_id, (name, target_score, _areas) in MINISTER_SCORES.items():
        for i, snap_date in enumerate(snapshot_dates):
            frac = i / (len(snapshot_dates) - 1)
            overall = round(target_score * frac, 1)
            score_rows.append((
                minister_id,
                snap_date,
                snap_date + timedelta(days=6),
                round(overall * 0.85, 1),  # manifesto_compliance
                round(min(overall * 1.1, 100), 1),  # public_accountability
                overall,
                round(overall * 0.9, 1),  # outcome_score
            ))

    cur.executemany("""
        INSERT INTO scores
            (minister_id, period_start, period_end,
             manifesto_compliance, public_accountability, overall, outcome_score)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, score_rows)
    conn.commit()
    print(f"  Inserted {len(score_rows)} score snapshots")

    # ─── 6. Update ministers.overall_score ───────────────────────────────────
    print("\nUpdating ministers.overall_score...")
    for minister_id, (name, target_score, _areas) in MINISTER_SCORES.items():
        cur.execute(
            "UPDATE ministers SET overall_score = %s WHERE id = %s",
            (float(target_score), minister_id)
        )
    conn.commit()

    # ─── 7. Minister-manifesto assignments ───────────────────────────────────
    print("\nSeeding minister_manifesto_assignments...")
    cur.execute("DELETE FROM minister_manifesto_assignments")
    assign_rows = []
    for minister_id, bp_nums in MINISTER_BP_RANGES.items():
        for bp_num in bp_nums:
            bp_key = f"bp-{bp_num:03d}"
            item_id = bp_uuid.get(bp_key)
            if item_id:
                assign_rows.append((minister_id, item_id))
    cur.executemany("""
        INSERT INTO minister_manifesto_assignments (minister_id, manifesto_item_id)
        VALUES (%s, %s)
        ON CONFLICT DO NOTHING
    """, assign_rows)
    conn.commit()
    print(f"  Inserted {len(assign_rows)} assignments")

    conn.close()
    print("\n\u2713 Seed complete.")


if __name__ == "__main__":
    main()

