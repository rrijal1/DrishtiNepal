#!/usr/bin/env python3
"""Fetch Data360 datasets mentioning 'Nepal' and save sample data per database/indicator.

Saves samples to: exports/data360/nepal/{DATABASE_ID}/{INDICATOR}.json
Produces index CSV: exports/data360/nepal/index.csv
"""
import os
import sys
import time
import json
import requests
from pathlib import Path

ROOT = "https://data360api.worldbank.org"
SEARCH_EP = ROOT + "/data360/searchv2"
INDICATORS_EP = ROOT + "/data360/indicators"
DATA_EP = ROOT + "/data360/data"

OUT_DIR = Path("exports/data360/nepal")
OUT_DIR.mkdir(parents=True, exist_ok=True)

def post_search(session, payload):
    r = session.post(SEARCH_EP, json=payload, timeout=30)
    r.raise_for_status()
    return r.json()

def get_indicators(session, dataset_id):
    params = {"datasetId": dataset_id}
    r = session.get(INDICATORS_EP, params=params, timeout=30)
    r.raise_for_status()
    try:
        return r.json()
    except Exception:
        return None

def get_data(session, database_id, indicator_id, ref_area="NPL", top=100):
    params = {
        "DATABASE_ID": database_id,
        "INDICATOR": indicator_id,
        "REF_AREA": ref_area,
        "top": top,
    }
    r = session.get(DATA_EP, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def safe_filename(s: str) -> str:
    return "".join(c if c.isalnum() or c in "._-" else "_" for c in s)[:200]

def main():
    sess = requests.Session()
    sess.headers.update({"User-Agent": "fetch-data360-nepal/1.0"})

    print("Searching Data360 for 'Nepal'...")
    payload = {
        "count": True,
        "search": "Nepal",
        "select": "series_description/idno,series_description/name,series_description/database_id",
        "top": 1000,
    }
    resp = post_search(sess, payload)
    values = resp.get("value") or resp.get("items") or []

    # collect distinct database_ids and candidate series idnos
    db_map = {}
    for item in values:
        sd = item.get("series_description") if isinstance(item, dict) else None
        if not sd:
            continue
        db = sd.get("database_id") or sd.get("databaseId")
        idno = sd.get("idno")
        name = sd.get("name")
        if not db:
            continue
        db_map.setdefault(db, set())
        if idno:
            db_map[db].add(idno)

    print(f"Found {len(db_map)} databases mentioning Nepal")

    index_rows = []

    for db_idx, (db, idnos) in enumerate(sorted(db_map.items())):
        print(f"[{db_idx+1}/{len(db_map)}] Database: {db} (candidates={len(idnos)})")
        db_dir = OUT_DIR / safe_filename(db)
        db_dir.mkdir(parents=True, exist_ok=True)

        # fetch indicators list for this database (may be heavy)
        try:
            inds = get_indicators(sess, db)
        except Exception as e:
            print(f"  Failed to get indicators for {db}: {e}")
            inds = None

        indicators = []
        if isinstance(inds, list) and len(inds) > 0:
            # expectation: list of indicator ids or objects
            for it in inds[:200]:
                if isinstance(it, dict):
                    # try to find id field
                    iid = it.get("id") or it.get("indicator") or it.get("INDICATOR") or it.get("series_description/idno")
                    if not iid:
                        # try name
                        iid = it.get("name")
                    if iid:
                        indicators.append(iid)
                else:
                    indicators.append(str(it))
        else:
            # fall back to candidate idnos from search hits
            indicators = list(idnos)[:200]

        print(f"  Checking up to {len(indicators)} indicators for REF_AREA=NPL")

        for ind_idx, indicator in enumerate(indicators):
            try:
                data = get_data(sess, db, indicator, ref_area="NPL", top=100)
            except Exception as e:
                print(f"    [{ind_idx+1}/{len(indicators)}] {indicator}: request failed: {e}")
                time.sleep(0.5)
                continue

            # Determine where observations live in response
            # Many responses use 'value' or 'data' or top-level array
            sample = None
            if isinstance(data, dict):
                sample = data.get("value") or data.get("data") or data.get("items")
            elif isinstance(data, list):
                sample = data

            sample_count = 0
            if isinstance(sample, list):
                sample_count = len(sample)
            elif isinstance(sample, dict):
                sample_count = 1

            fname = db_dir / f"{safe_filename(str(indicator))}.json"
            with open(fname, "w") as f:
                json.dump({"db": db, "indicator": indicator, "sample_count": sample_count, "sample": sample}, f, indent=2, ensure_ascii=False)

            index_rows.append((db, indicator, sample_count, str(fname)))
            print(f"    [{ind_idx+1}/{len(indicators)}] {indicator}: sample_count={sample_count}")
            # be nice to the API
            time.sleep(0.2)

    # write index CSV
    import csv
    idx_file = OUT_DIR / "index.csv"
    with open(idx_file, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["database_id", "indicator", "sample_count", "sample_file"])
        for row in index_rows:
            w.writerow(row)

    print("Done. Samples and index saved to", OUT_DIR)


if __name__ == '__main__':
    main()
