#!/usr/bin/env python3
"""Expanded Data360 Nepal search.

This script:
- paginates POST /data360/searchv2 with search='Nepal' to collect all hits
- deduplicates series by (database_id, idno)
- for each series, checks GET /data360/data?DATABASE_ID=...&INDICATOR=...&REF_AREA=NPL for presence of 2025/2026
- writes outputs under exports/data360/nepal_summary/
  - index.csv (database,indicator,idno,name,has2025,has2026,sample_file)
  - samples/*.json for indicators that have 2025/2026 (one sample record)

Notes: The script only fetches small responses (top=200) per indicator and stops politely to avoid excessive load.
"""
import requests, json, time, csv
from pathlib import Path
ROOT = 'https://data360api.worldbank.org'
SEARCH = ROOT + '/data360/searchv2'
DATA = ROOT + '/data360/data'

OUT_DIR = Path('exports/data360/nepal_summary')
SAMPLES_DIR = OUT_DIR / 'samples'
OUT_DIR.mkdir(parents=True, exist_ok=True)
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)

sess = requests.Session()
sess.headers.update({'Content-Type': 'application/json', 'User-Agent': 'data360-nepal-expanded/1.0'})

def fetch_all_search_hits(term='Nepal', page_size=1000, max_hits=50000):
    hits = []
    skip = 0
    while True:
        payload = {'count': True, 'search': term, 'select': 'series_description/idno,series_description/name,series_description/database_id', 'top': page_size, 'skip': skip}
        r = sess.post(SEARCH, json=payload, timeout=30)
        r.raise_for_status()
        j = r.json()
        vals = j.get('value') or j.get('items') or []
        if not vals:
            break
        hits.extend(vals)
        skip += page_size
        if len(hits) >= max_hits:
            break
        # small pause
        time.sleep(0.2)
    return hits

def check_indicator_for_years(database, indicator, years=('2025','2026')):
    params = {'DATABASE_ID': database, 'INDICATOR': indicator, 'REF_AREA': 'NPL', 'top': 200}
    try:
        r = sess.get(DATA, params=params, timeout=30)
        r.raise_for_status()
        j = r.json()
    except Exception as e:
        return {y: False for y in years}, None
    arr = j.get('value') or j.get('data') or j.get('items') or []
    found = {y: False for y in years}
    sample = None
    if isinstance(arr, list):
        for rec in arr:
            tp = rec.get('TIME_PERIOD') or rec.get('timePeriod') or rec.get('TIME') or rec.get('time_period') or rec.get('year')
            if tp is None:
                continue
            year = str(tp)[:4]
            if year in found and not found[year]:
                found[year] = True
                sample = rec
            # early exit if all found
            if all(found.values()):
                break
    return found, sample

def safe_filename(s):
    return ''.join(c if c.isalnum() or c in '._-' else '_' for c in str(s))[:200]

def main():
    print('Fetching all search hits for Nepal...')
    hits = fetch_all_search_hits('Nepal', page_size=1000, max_hits=50000)
    print(f'Got {len(hits)} raw hits')

    # dedupe by (db,idno)
    series_map = {}
    for it in hits:
        sd = it.get('series_description') if isinstance(it, dict) else None
        if not sd:
            continue
        db = sd.get('database_id') or sd.get('databaseId')
        idno = sd.get('idno')
        name = sd.get('name')
        if not db or not idno:
            continue
        key = (db, idno)
        if key not in series_map:
            series_map[key] = {'database': db, 'idno': idno, 'name': name}

    print(f'Found {len(series_map)} unique series (database+idno)')

    index_rows = []
    # iterate and check years, but be polite
    for idx, ((db, idno), info) in enumerate(sorted(series_map.items()), 1):
        print(f'[{idx}/{len(series_map)}] Checking {db} {idno} - {info.get("name")[:80]}')
        found, sample = check_indicator_for_years(db, idno, years=('2025','2026'))
        sample_file = ''
        if sample:
            sf = SAMPLES_DIR / (safe_filename(f"{db}_{idno}") + '.json')
            with open(sf, 'w') as f:
                json.dump(sample, f, ensure_ascii=False, indent=2)
            sample_file = str(sf)
        index_rows.append({'database': db, 'idno': idno, 'name': info.get('name'), 'has2025': found.get('2025', False), 'has2026': found.get('2026', False), 'sample_file': sample_file})
        time.sleep(0.15)

    # write CSV
    with open(OUT_DIR / 'index.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['database', 'idno', 'name', 'has2025', 'has2026', 'sample_file'])
        for r in index_rows:
            w.writerow([r['database'], r['idno'], r['name'], int(r['has2025']), int(r['has2026']), r['sample_file']])

    # write markdown summary for those with data
    with open(OUT_DIR / 'summary.md', 'w') as f:
        f.write('# Data360 — Nepal indicators with 2025/2026 data\n\n')
        for r in index_rows:
            if r['has2025'] or r['has2026']:
                f.write(f"- **{r['database']}** / `{r['idno']}` — {r['name']} — 2025:{r['has2025']} 2026:{r['has2026']}\n")
    print('Done. Outputs under', OUT_DIR)

if __name__ == '__main__':
    main()
