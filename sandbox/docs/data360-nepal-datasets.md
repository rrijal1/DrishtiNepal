# Data360 — Nepal datasets (summary)

This document summarizes how to discover Data360 datasets related to Nepal and includes a sampled list of matching entries returned by the Data360 search API.

API roots
- `https://data360api.worldbank.org`
- Search endpoint: `POST /data360/searchv2`
- Data retrieval: `GET /data360/data` (requires `DATABASE_ID` and other query params)
- Indicators: `GET /data360/indicators?datasetId=...`
- Metadata: `POST /data360/metadata` (body: {"query": "&$filter=..."})
- Disaggregation: `GET /data360/disaggregation?indicatorId=...` or `?datasetId=...`

How I fetched Nepal-related entries
1. Use free-text search for `Nepal`:

```bash
curl -sS -X POST 'https://data360api.worldbank.org/data360/searchv2' \
  -H 'Content-Type: application/json' \
  -d '{"count":true,"search":"Nepal","select":"series_description/idno,series_description/name,series_description/database_id","top":1000}' \
  | jq '.'
```

2. The `value` array contains search hits. Many items are documents or indicator series from multiple databases (WB_WDI, WB_BPS, IMF_FSI, etc.).

3. To fetch numeric observations for Nepal from a database, use `/data360/data` with `DATABASE_ID` and `REF_AREA=NPL` plus optional `INDICATOR`, `timePeriodFrom`, `timePeriodTo`.

Example: fetch indicator data for Nepal from `WB_WDI` (replace `INDICATOR` with actual indicator code):

```bash
curl -sS 'https://data360api.worldbank.org/data360/data?DATABASE_ID=WB_WDI&INDICATOR=WB_WDI_SP_POP_TOTL&REF_AREA=NPL&timePeriodFrom=2000&timePeriodTo=2022&top=1000' | jq '.'
```

Notes on filtering
- The `searchv2` endpoint accepts an OData-like `filter` expression (see OpenAPI). You can filter by fields under `series_description` using expressions like:
  - `series_description/database_id eq 'WB_WDI'`
  - `series_description/topics/any(t: t/name eq 'Health')`
  - (Field names for location vary; free-text `search` is often easiest.)

Sample of matching entries (database_id, name) — first ~120 results from a `search: Nepal` query:

```
	Nepal - Managing public finances for a new Nepal : a public finance management review
	Nepal - Resilience amidst conflict: an assessment of poverty in Nepal, 1995-96 and 2003-04
	Climbing higher : toward a middle-income Nepal
	Nepal - Public expenditure review
	Nepal : Public expenditure review - Roads
	Nepal - Public expenditure review : Main report
	Nepal - Country Climate and Development Report : Executive Summary
	Risks to Poverty, Vulnerability, and Inequality from COVID-19 : Nepal Light Poverty Assessment
	Federalism and Public Expenditure for Human Development in Nepal : An Emerging Agenda
	Nepal - Country economic memorandum
	... (many indicator series follow) ...
WB_CLEAR	Prevalence of undernourishment (% of population)
WB_CLEAR	Services, value added (% of GDP)
WB_CLEAR	Manufacturing, value added (% of GDP)
WB_CLEAR	Urban population (% of total population)
WB_CLEAR	GDP (current US$)
IMF_FM	Expenditure (% of GDP)
IMF_FM	Net lending/borrowing (also referred as overall balance) (% of GDP)
IMF_FM	Primary net lending/borrowing (also referred as primary balance) (% of GDP)
... (truncated) ...
```

Programmatic approach to get a comprehensive picture
1. Run `searchv2` with `search: Nepal` and `top` set to a large value (e.g., 1000). If results exceed 1000, use pagination via `skip`.
2. From hits, extract `series_description.database_id` and `series_description.idno` or `series_description/name` where present.
3. For each distinct `database_id`, call `GET /data360/indicators?datasetId=DATABASE_ID` to list indicators available in that database.
4. For each indicator, call `GET /data360/data` with `DATABASE_ID`, `INDICATOR`, `REF_AREA=NPL` and time filters to retrieve observations.

I can run this programmatic pipeline and produce a CSV listing: `database_id,indicator_id,indicator_name,has_data_for_NPL` — do you want me to run that now and save results under `data/`? 
