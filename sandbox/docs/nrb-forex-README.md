# NRB Forex API — Quick Reference

## Overview

This document records the National Bank of Nepal (NRB) forex API endpoints and quick examples for extracting EUR, USD and CNY exchange rates.

## Base URL

- **Base:** `https://www.nrb.org.np/api/forex/v1/`

## Endpoints

- **Root:** `GET https://www.nrb.org.np/api/forex/v1/`
  - Returns available routes and basic metadata.
- **Rates (list):** `GET https://www.nrb.org.np/api/forex/v1/rates`
  - This endpoint expects pagination/date parameters; returns 400 when required params are missing.
- **Rate (single date):** `GET https://www.nrb.org.np/api/forex/v1/rate?date=YYYY-MM-DD`
  - Returns the published rates for the given date.
- **App-rate:** `GET https://www.nrb.org.np/api/forex/v1/app-rate`
  - Additional format for app consumption (check root for availability).

## Date format

- Use `YYYY-MM-DD` (example: `2026-04-04`). Use UTC date when querying `date=$(date -u +%Y-%m-%d)`.

## Sample: fetch rates for a date

Request (specific date):

```bash
curl -sS -G 'https://www.nrb.org.np/api/forex/v1/rate' \
  --data-urlencode "date=2026-04-04"
```

Request (today, UTC):

```bash
DATE=$(date -u +%Y-%m-%d)
curl -sS -G 'https://www.nrb.org.np/api/forex/v1/rate' --data-urlencode "date=$DATE"
```

Typical response shape (truncated):

```json
{
  "data": {
    "payload": {
      "date": "2026-04-04",
      "rates": [
        {"currency": {"iso3":"EUR","name":"European Euro","unit":1}, "buy":"171.62","sell":"172.31"},
        {"currency": {"iso3":"USD","name":"U.S. Dollar","unit":1}, "buy":"148.67","sell":"149.27"},
        {"currency": {"iso3":"CNY","name":"Chinese Yuan","unit":1}, "buy":"21.61","sell":"21.69"}
      ]
    }
  }
}
```

## Extracting EUR / USD / CNY using `jq`

Install `jq` if needed. Example commands below assume a POSIX shell.

- Get EUR entry:

```bash
curl -sS -G 'https://www.nrb.org.np/api/forex/v1/rate' --data-urlencode "date=$DATE" \
  | jq -r '.data.payload.rates[] | select(.currency.iso3=="EUR")'
```

- Get USD buy/sell in a compact line:

```bash
curl -sS -G 'https://www.nrb.org.np/api/forex/v1/rate' --data-urlencode "date=$DATE" \
  | jq -r '.data.payload.rates[] | select(.currency.iso3=="USD") | "USD buy:\(.buy) sell:\(.sell) unit:\(.currency.unit)"'
```

- Get CNY buy/sell:

```bash
curl -sS -G 'https://www.nrb.org.np/api/forex/v1/rate' --data-urlencode "date=$DATE" \
  | jq -r '.data.payload.rates[] | select(.currency.iso3=="CNY") | "CNY buy:\(.buy) sell:\(.sell)"'
```

## Field notes

- **`currency.iso3`**: 3-letter ISO code (e.g., `EUR`, `USD`, `CNY`).
- **`currency.unit`**: number of currency units the rate applies to (e.g., `100` for INR).
- **`buy` / `sell`**: bank buy and sell rates as strings (decimal numbers).

## Tips & next steps

- If you want a CSV export, I can add a small script that maps `iso3,buy,sell,unit,date` and writes to `rates.csv`.
- To track rates over time, schedule a daily `cron` (or GitHub Action) that hits the `rate` endpoint and appends results.

---
Created: NRB forex endpoints and examples (EUR, USD, CNY).
