"""
Drishti Nepal — Parliament Tracker Agent
Tracks bills, committee reports, Q&A sessions, and votes from Nepal's Parliament.

Schedule: Every 2 hours
Sources: hr.parliament.gov.np (House of Representatives)
         na.parliament.gov.np (National Assembly)

Records are auto-classified and linked to manifesto items.
Bills and votes are flagged for moderator review.
"""

import re
import json
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("parliament_tracker")

HEADERS = {
    "User-Agent": "DrishtiNepal/1.0 (https://drishtinepal.com)",
    "Accept-Language": "ne,en;q=0.9",
}
HTTP_TIMEOUT = 30

PARLIAMENT_SOURCES = [
    {
        "name": "House of Representatives",
        "chamber": "house",
        "base_url": "https://hr.parliament.gov.np",
        "paths": {
            "bills": "/bills",
            "committees": "/committee",
            "notices": "/notice",
        },
    },
    {
        "name": "National Assembly",
        "chamber": "national_assembly",
        "base_url": "https://na.parliament.gov.np",
        "paths": {
            "bills": "/bills",
            "notices": "/notice",
        },
    },
]


def fetch_page(url: str) -> BeautifulSoup | None:
    """Fetch and parse a parliament page."""
    try:
        resp = httpx.get(
            url, headers=HEADERS, timeout=HTTP_TIMEOUT, follow_redirects=True
        )
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except httpx.HTTPStatusError as e:
        logger.warning(f"HTTP {e.response.status_code} from {url}")
    except Exception as e:
        logger.warning(f"Failed to fetch {url}: {e}")
    return None


def extract_records_from_page(
    soup: BeautifulSoup, record_type: str, chamber: str, base_url: str
) -> list[dict]:
    """Extract parliament records from a parsed page."""
    records = []

    # Parliament sites typically use tables or card layouts
    rows = soup.select(
        "table tbody tr, .card, .list-group-item, article, .news-item, .bill-item"
    )
    for row in rows:
        text = row.get_text(separator=" ", strip=True)
        if not text or len(text) < 10:
            continue

        links = row.find_all("a", href=True)
        source_url = None
        for link in links:
            href = link["href"]
            if href and not href.startswith("#"):
                source_url = href if href.startswith("http") else f"{base_url}{href}"
                break

        # Extract date
        date_match = re.search(r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})", text)
        record_date = (
            date_match.group(1).replace("/", "-")
            if date_match
            else datetime.now(timezone.utc).date().isoformat()
        )

        records.append(
            {
                "record_type": record_type,
                "chamber": chamber,
                "record_date": record_date,
                "title_np": text[:500].strip(),
                "source_url": source_url,
            }
        )

    return records


def classify_parliament_record(title: str, record_type: str) -> dict:
    """Use AI to classify a parliament record and extract structured info."""
    prompt = f"""Analyze this Nepal Parliament record and classify it.

Record type: {record_type}
Title/Text: {title}

Return a JSON object with:
- "title_en": English translation (brief, max 200 chars)
- "summary_en": One-sentence English summary
- "status": one of: introduced, in_committee, passed, rejected, withdrawn, recorded, pending
- "significance": one of: critical, high, medium, low
- "related_manifesto_areas": list of relevant karar patra areas (pp-001 through pp-005) if applicable

Respond ONLY with the JSON object, no markdown."""

    try:
        response = cheap_completion(
            prompt,
            system="You are a Nepal parliament analyst. Classify records accurately.",
        )
        cleaned = re.sub(r"```json?\s*|\s*```", "", response).strip()
        return json.loads(cleaned)
    except Exception as e:
        logger.warning(f"AI classification failed: {e}")
        return {
            "title_en": title[:200],
            "summary_en": "",
            "status": "recorded",
            "significance": "medium",
            "related_manifesto_areas": [],
        }


def is_duplicate(title_np: str, record_date: str, chamber: str) -> bool:
    """Check if a parliament record already exists."""
    result = (
        db.table("parliament_records")
        .select("id")
        .eq("record_date", record_date)
        .eq("chamber", chamber)
        .ilike("title_np", f"%{title_np[:80]}%")
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def link_to_manifesto(areas: list[str]) -> str | None:
    """Look up the manifesto_item_id for a priority area."""
    if not areas:
        return None
    for area in areas:
        result = (
            db.table("manifesto_items")
            .select("id")
            .eq("source_id", area)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["id"]
    return None


def get_minister_map() -> dict[str, str]:
    """Get active ministers name → id map."""
    result = (
        db.table("ministers").select("id, name_en").eq("status", "active").execute()
    )
    return {m["name_en"].lower(): m["id"] for m in result.data}


def find_related_minister(title: str, minister_map: dict[str, str]) -> str | None:
    """Check if any minister is mentioned in the record title."""
    title_lower = title.lower()
    for name, mid in minister_map.items():
        # Match on last name (most common in parliament context)
        parts = name.split()
        if any(part.lower() in title_lower for part in parts if len(part) > 3):
            return mid
    return None


def queue_for_review(record_id: str, title: str, record_type: str, significance: str):
    """Add significant records to review queue."""
    needs_review = record_type in ("bill", "vote", "resolution") or significance in (
        "critical",
        "high",
    )
    if not needs_review:
        return

    priority = (
        "high"
        if significance in ("critical", "high") or record_type == "bill"
        else "normal"
    )
    db.table("content_review_queue").insert(
        {
            "content_type": "parliament_record",
            "content_id": record_id,
            "priority": priority,
            "status": "pending",
            "title": title[:500],
        }
    ).execute()


def store_record(raw: dict, classification: dict, minister_map: dict) -> str | None:
    """Store a parliament record."""
    manifesto_id = link_to_manifesto(classification.get("related_manifesto_areas", []))
    related_minister = find_related_minister(
        raw.get("title_np", "") + " " + classification.get("title_en", ""),
        minister_map,
    )

    significance = classification.get("significance", "medium")
    review_status = (
        "needs_review"
        if raw["record_type"] in ("bill", "vote")
        or significance in ("critical", "high")
        else "auto_published"
    )

    record = {
        "record_type": raw["record_type"],
        "chamber": raw["chamber"],
        "record_date": raw["record_date"],
        "title_en": classification.get("title_en", ""),
        "title_np": raw.get("title_np", ""),
        "summary_en": classification.get("summary_en", ""),
        "source_url": raw.get("source_url"),
        "status": classification.get("status", "recorded"),
        "related_minister_id": related_minister,
        "manifesto_item_id": manifesto_id,
        "ai_summary": classification.get("summary_en", ""),
        "review_status": review_status,
    }

    result = db.table("parliament_records").insert(record).execute()
    record_id = result.data[0]["id"]

    queue_for_review(
        record_id,
        classification.get("title_en", raw.get("title_np", "")),
        raw["record_type"],
        significance,
    )

    return record_id


def run():
    """Main entry point for the parliament tracker agent."""
    run_id = log_agent_run("parliament_tracker")
    items_processed = 0
    items_created = 0

    try:
        minister_map = get_minister_map()

        for source in PARLIAMENT_SOURCES:
            chamber = source["chamber"]
            base_url = source["base_url"]
            logger.info(f"Scanning {source['name']}...")

            for record_type, path in source["paths"].items():
                # Map path names to record_types
                type_map = {
                    "bills": "bill",
                    "committees": "committee_report",
                    "notices": "notice",
                }
                rtype = type_map.get(record_type, "notice")

                url = f"{base_url}{path}"
                soup = fetch_page(url)
                if not soup:
                    continue

                records = extract_records_from_page(soup, rtype, chamber, base_url)
                items_processed += len(records)

                for raw in records:
                    title_np = raw.get("title_np", "")
                    if not title_np:
                        continue

                    if is_duplicate(title_np, raw["record_date"], chamber):
                        continue

                    classification = classify_parliament_record(title_np, rtype)
                    record_id = store_record(raw, classification, minister_map)

                    if record_id:
                        items_created += 1
                        logger.info(
                            f"  [{chamber}/{rtype}] {classification.get('title_en', '')[:60]}"
                        )

        logger.info(
            f"Parliament Tracker: {items_created} new records from {items_processed} scanned"
        )
        complete_agent_run(run_id, "success", items_processed, items_created)

    except Exception as e:
        logger.error(f"Parliament Tracker failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_created, str(e))
        raise
