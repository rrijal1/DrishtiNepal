# World Bank Data360 API — Quick Reference

Source: OpenAPI v1 (OAS 3.0)

- Raw spec: https://raw.githubusercontent.com/worldbank/open-api-specs/refs/heads/main/Data360%20Open_API.json

Base server

- https://data360api.worldbank.org

Overview
This API provides access to Data360 dataset search, metadata and data files.

Primary endpoints

- POST /data360/searchv2
  - Search the Data360 catalog. Use a JSON body containing search filters (see spec for full schema).

  Example:

  ```bash
  curl -sS -X POST 'https://data360api.worldbank.org/data360/searchv2' \
    -H 'Content-Type: application/json' \
    -d '{"q":"air pollution","page":1,"per_page":10}' \
    | jq '.'
  ```

- GET /data360/data
  - Retrieve dataset data files or filtered data. The endpoint accepts query parameters (filters) described in the spec.

  Example (generic):

  ```bash
  curl -sS 'https://data360api.worldbank.org/data360/data?dataset_id=YOUR_DATASET_ID&format=json' | jq '.'
  ```

- GET /data360/indicators
  - List indicator IDs available in Data360.

  Example:

  ```bash
  curl -sS 'https://data360api.worldbank.org/data360/indicators' | jq '.'
  ```

- POST /data360/metadata
  - Retrieve metadata records based on provided filters in the POST body.

  Example:

  ```bash
  curl -sS -X POST 'https://data360api.worldbank.org/data360/metadata' \
    -H 'Content-Type: application/json' \
    -d '{"dataset_id":"YOUR_DATASET_ID"}' \
    | jq '.'
  ```

- GET /data360/disaggregation
  - Return disaggregation values for a given indicator (breakdowns by group/attribute).

  Example:

  ```bash
  curl -sS 'https://data360api.worldbank.org/data360/disaggregation?indicator=INDICATOR_ID' | jq '.'
  ```

Notes & next steps

- The API root returns 404 for the bare host; use the above paths under the documented server.
- For exact request/response schemas, consult the provided OpenAPI JSON (link at top).
- If you want, I can:
  - fetch and show a sample response for a specific dataset/indicator, or
  - generate a small Python script that wraps these endpoints and writes CSV/JSON output.

---

Created: Data360 API quick reference.
