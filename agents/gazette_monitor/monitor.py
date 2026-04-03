"""
Drishti Nepal — Gazette Monitor Agent
Tracks official government gazette notifications from rajpatra.dop.gov.np.

Schedule: Every 6 hours
Source: Nepal Gazette (rajpatra.dop.gov.np) — primarily HTML listing + PDF links
Fallback: Manual entries via moderator dashboard

Gazette entries are auto-classified by AI and linked to manifesto items where possible.
High-significance entries are flagged for moderator review.
"""

import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import (
    setup_logger,
    log_agent_run,
    complete_agent_run,
    parse_ai_json,
    link_to_manifesto,
    queue_for_review,
)

logger = setup_logger("gazette_monitor")

GAZETTE_BASE_URL = "https://rajpatra.dop.gov.np"
GAZETTE_LIST_URL = f"{GAZETTE_BASE_URL}/welcome/list"
HEADERS = {
    "User-Agent": "DrishtiNepal/1.0 (https://drishtinepal.com)",
    "Accept-Language": "ne,en;q=0.9",
}
HTTP_TIMEOUT = 30


def fetch_gazette_listing() -> list[dict]:
    """Fetch recent gazette entries from the Nepal Gazette website."""
    entries = []
    try:
        resp = httpx.get(
            GAZETTE_LIST_URL,
            headers=HEADERS,
            timeout=HTTP_TIMEOUT,
            follow_redirects=True,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # The gazette site typically lists entries in a table or list
        # Parse whatever structure is available
        rows = soup.select("table tr, .gazette-item, .list-group-item, article")
        for row in rows:
            entry = _parse_gazette_row(row)
            if entry:
                entries.append(entry)

        logger.info(f"Fetched {len(entries)} gazette entries from listing page")
    except httpx.HTTPStatusError as e:
        logger.warning(f"HTTP error from gazette site: {e.response.status_code}")
    except Exception as e:
        logger.warning(f"Failed to fetch gazette listing: {e}")

    return entries


def _parse_gazette_row(row) -> dict | None:
    """Parse a single gazette entry from HTML row."""
    links = row.find_all("a", href=True)
    if not links:
        return None

    text = row.get_text(separator=" ", strip=True)
    if not text or len(text) < 10:
        return None

    # Find PDF links
    pdf_url = None
    source_url = None
    for link in links:
        href = link["href"]
        if href.endswith(".pdf"):
            pdf_url = href if href.startswith("http") else f"{GAZETTE_BASE_URL}{href}"
        else:
            source_url = (
                href if href.startswith("http") else f"{GAZETTE_BASE_URL}{href}"
            )

    # Extract gazette number if present (e.g., "Vol 73 No 42")
    gazette_num_match = re.search(r"(?:Vol|भाग)\s*(\d+)\s*(?:No|नं)\s*(\d+)", text)
    gazette_number = (
        f"Vol {gazette_num_match.group(1)} No {gazette_num_match.group(2)}"
        if gazette_num_match
        else None
    )

    # Extract date (try Nepali BS date patterns and standard dates)
    date_match = re.search(r"(\d{4}[-/]\d{1,2}[-/]\d{1,2})", text)
    published_date = (
        date_match.group(1)
        if date_match
        else datetime.now(timezone.utc).date().isoformat()
    )

    return {
        "title_np": text[:300].strip(),
        "gazette_number": gazette_number,
        "published_date": published_date,
        "source_url": source_url or pdf_url,
        "pdf_url": pdf_url,
    }


def classify_gazette_entry(title: str) -> dict:
    """Use AI to classify a gazette entry and extract structured info."""
    prompt = f"""Analyze this Nepal Gazette (Rajpatra) entry and classify it.

Title/Text: {title}

Return a JSON object with:
- "title_en": English translation of the title (brief)
- "summary_en": One-sentence English summary of what this gazette notification does
- "category": one of: law, regulation, appointment, policy, budget, notification, ordinance, general
- "significance": one of: critical, high, medium, low
- "related_manifesto_areas": list of relevant karar patra areas (pp-001 through pp-005) if applicable, empty list otherwise

Respond ONLY with the JSON object, no markdown."""

    try:
        response = cheap_completion(
            prompt,
            system="You are a Nepal governance analyst. Classify gazette entries accurately.",
        )
        fallback = {
            "title_en": title[:200],
            "summary_en": "",
            "category": "general",
            "significance": "medium",
            "related_manifesto_areas": [],
        }
        return parse_ai_json(response, fallback) or fallback
    except Exception as e:
        logger.warning(f"AI classification failed: {e}")
        return {
            "title_en": title[:200],
            "summary_en": "",
            "category": "general",
            "significance": "medium",
            "related_manifesto_areas": [],
        }


def is_duplicate(title_np: str, published_date: str) -> bool:
    """Check if a gazette entry already exists."""
    result = (
        db.table("gazette_entries")
        .select("id")
        .eq("published_date", published_date)
        .ilike("title_np", f"%{title_np[:100]}%")
        .limit(1)
        .execute()
    )
    return len(result.data) > 0


def store_entry(entry: dict, classification: dict) -> str | None:
    """Store a gazette entry and optionally queue for review."""
    manifesto_id = link_to_manifesto(classification.get("related_manifesto_areas", []))

    # Determine review status
    significance = classification.get("significance", "medium")
    review_status = (
        "needs_review" if significance in ("critical", "high") else "auto_published"
    )

    record = {
        "gazette_number": entry.get("gazette_number"),
        "published_date": entry["published_date"],
        "title_en": classification.get("title_en", ""),
        "title_np": entry.get("title_np", ""),
        "summary_en": classification.get("summary_en", ""),
        "source_url": entry.get("source_url"),
        "pdf_url": entry.get("pdf_url"),
        "category": classification.get("category", "general"),
        "significance": significance,
        "manifesto_item_id": manifesto_id,
        "ai_summary": classification.get("summary_en", ""),
        "review_status": review_status,
    }

    result = db.table("gazette_entries").insert(record).execute()
    entry_id = result.data[0]["id"]

    # Queue critical/high items for moderator review
    if review_status == "needs_review":
        queue_for_review(
            content_type="gazette_entry",
            content_id=entry_id,
            title=classification.get("title_en", entry.get("title_np", "")),
            significance=significance,
        )
        logger.info(f"  Queued for review: {classification.get('title_en', '')[:80]}")

    return entry_id


def run():
    """Main entry point for the gazette monitor agent."""
    run_id = log_agent_run("gazette_monitor")
    items_processed = 0
    items_created = 0

    try:
        # Fetch listings from gazette website
        entries = fetch_gazette_listing()
        items_processed = len(entries)

        for entry in entries:
            title_np = entry.get("title_np", "")
            if not title_np:
                continue

            # Dedup check
            if is_duplicate(title_np, entry["published_date"]):
                continue

            # AI classification
            classification = classify_gazette_entry(title_np)

            # Store
            entry_id = store_entry(entry, classification)
            if entry_id:
                items_created += 1
                logger.info(
                    f"  Stored: [{classification.get('category')}] "
                    f"{classification.get('title_en', '')[:80]} "
                    f"({classification.get('significance')})"
                )

        logger.info(
            f"Gazette Monitor: {items_created} new entries from {items_processed} fetched"
        )
        complete_agent_run(run_id, "success", items_processed, items_created)

    except Exception as e:
        logger.error(f"Gazette Monitor failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_created, str(e))
        raise
