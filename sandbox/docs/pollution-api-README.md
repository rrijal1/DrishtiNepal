# Pollution Portal (Nepal) — API Reference

## Overview

The pollution portal front-end (`https://pollution.gov.np/portal/`) calls a public GSS API. This file records the exact endpoints, data shapes, and example commands for pulling station and observation data — focused on Kathmandu and major towns.

## Base URL

- **Base:** `https://pollution.gov.np/gss/api`

## Key endpoints

- `GET /gss/api/station`
  - Returns an array of stations with fields: `id`, `name`, `latitude`, `longitude`, and other metadata.

- `GET /gss/api/station/{station_id}/data-series`
  - Lists measurement series available at the station. Fields include: `id`, `name`, `unit`, `parameter_code`, etc. Look for series with names like `PM2.5 Inst`, `PM2.5 Daily Avg Agg`, `PM2.5 avg 10 mins`.

- `GET /gss/api/observation?series_id={series_id}&date_from={ISO}&date_to={ISO}`
  - Returns observations for the requested series in the time window. Response shape: `{"status":..., "data": [{"datetime":"...","value":...}, ...]}`

Notes: endpoints are public and were observed being called by the site. Use ISO datetimes: `YYYY-MM-DDTHH:MM:SS` (UTC where appropriate).

## Data types / fields

- Station object (from `/station`): `id`, `name`, `latitude`, `longitude`, `tags`, etc.
- Data-series object (from `/station/{id}/data-series`): `id`, `name`, `unit`, `parameter_code`.
- Observation object (from `/observation`): `datetime` (ISO string), `value` (numeric). Some series return high-frequency data (per-minute), some daily aggregates.

## Stations of interest (Kathmandu + major towns)

Below are station entries useful for Kathmandu and major Nepali towns (sampled from `/gss/api/station`). Use these `id` values to query `data-series` and `observation`.

- Kathmandu area / Lalitpur / Bhaktapur
  - `id:147` — Ratnapark_NMS (lat: 27.706697, lon: 85.315645)
  - `id:3` — Ratnapark (lat: 27.707014, lon: 85.31541)
  - `id:140` — Khumaltar (lat: 27.64665, lon: 85.3234)
  - `id:5` — Pulchowk (lat: 27.682581, lon: 85.318841)
  - `id:15` — TU Kirtipur (lat: 27.681719, lon: 85.289313)
  - `id:14` — Bhaktapur (lat: 27.673762, lon: 85.417528)

- Major towns (sample)
  - `id:70` — Bharatpur (lat: 27.672503, lon: 84.438393)
  - `id:67` — Biratnagar (lat: 26.4450921, lon: 87.2750912)
  - `id:69` — Hetauda (lat: 27.4226747, lon: 85.0344161)
  - `id:68` — Janakpur (lat: 26.739805, lon: 85.92854)
  - `id:71` — Dhangadhi (lat: 28.704133, lon: 80.5945)
  - `id:20` — Nepalgunj (lat: 28.05275, lon: 81.6222)
  - `id:50` — US Embassy (Kathmandu area, useful reference)

These IDs were sampled; always run `/gss/api/station` to check the latest station list and coordinates.

## Example commands

- List stations (first 20):

```bash
curl -sS 'https://pollution.gov.np/gss/api/station' | jq '.[:20]'
```

- List series for a station (example: Ratnapark id=3):

```bash
curl -sS 'https://pollution.gov.np/gss/api/station/3/data-series' | jq '.'
```

- Get observations for a series (last 24 hours):

```bash
# compute UTC times
DATE_TO=$(date -u +%Y-%m-%dT%H:%M:%S)
DATE_FROM=$(date -u -v-1d +%Y-%m-%dT%H:%M:%S) # BSD/macOS; use `date -u -d '1 day ago'` on Linux

curl -sS -G 'https://pollution.gov.np/gss/api/observation' \
  --data-urlencode 'series_id=2710' \
  --data-urlencode "date_from=$DATE_FROM" \
  --data-urlencode "date_to=$DATE_TO" \
  | jq '.data | length, .data[0:5]'
```

- Quick: get the latest value (take last item returned):

```bash
curl -sS -G 'https://pollution.gov.np/gss/api/observation' \
  --data-urlencode 'series_id=2710' \
  --data-urlencode "date_from=$(date -u -v-1h +%Y-%m-%dT%H:%M:%S)" \
  --data-urlencode "date_to=$(date -u +%Y-%m-%dT%H:%M:%S)" \
  | jq -r '.data | last'
```

Replace `series_id=2710` with the `id` of the PM2.5 series you find in `/station/{id}/data-series` for each station.

## Pollutants & aggregation

- You will commonly see PM2.5 series (instant, 10-min avg, daily avg). Some stations expose PM10, TSP, noise, temperature, humidity, and black carbon.
- Observation frequency varies: per-minute / per-10-min / hourly / daily aggregates.

## Next steps / suggestions

- I can add a small script `scripts/fetch_pollution.py` that:
  - fetches station list, finds PM2.5 series for selected stations (Kathmandu + chosen towns),
  - fetches last-24h observations and writes CSV rows: `station_id,station_name,series_id,datetime,value`,
  - optionally commit/append to `data/` or expose via GitHub Action for scheduled pulls.

---

Created: Pollution portal API quick reference — Kathmandu + major towns.
