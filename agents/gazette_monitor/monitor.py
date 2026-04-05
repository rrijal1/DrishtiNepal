"""
Drishti Nepal — Gazette Monitor (Cabinet Decisions from OPMCM)

Scrapes https://opmcm.gov.np/category/cabinet-decision/ daily.
Downloads monthly PDF bundles, extracts Nepali text with pdfplumber,
uses AI to parse individual decisions, and stores them in cabinet_decisions.

Schedule: Daily
Source:   Office of the Prime Minister and Council of Ministers (opmcm.gov.np)
Output:   cabinet_decisions, cabinet_decision_manifesto_links
"""

import io
import re
from datetime import datetime, timezone

import httpx
import pdfplumber
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

OPMCM_BASE = "https://opmcm.gov.np"
LISTING_URL = f"{OPMCM_BASE}/category/cabinet-decision/"

GAZETTE_BASE_URL = "https://rajpatra.dop.gov.np"
GAZETTE_LIST_URL = f"{GAZETTE_BASE_URL}/front/listview"

HEADERS = {
    "User-Agent": "DrishtiNepal/1.0 (https://drishtinepal.com; public interest accountability project)",
    "Accept-Language": "ne,en;q=0.9",
}
HTTP_TIMEOUT = 90  # PDFs can be large and slow
MAX_PDF_TEXT = 12000  # Characters to send to AI

# Map keywords in PDF filenames to readable month labels
PDF_MONTH_KEYWORDS = [
    ("CHAITRA", "Chaitra"),
    ("CHAIT", "Chaitra"),
    ("FALGUN", "Falgun"),
    ("MAGH", "Magh"),
    ("POUSH", "Poush"),
    ("MANSIR", "Mangsir"),
    ("KARTIK", "Kartik"),
    ("ASOJ", "Ashoj"),
    ("BHADRA", "Bhadra"),
    ("SHRAWAN", "Shrawan"),
    ("ASAR", "Asar"),
    ("JESTHA", "Jestha"),
    ("BAISAKH", "Baisakh"),
]


# ── Scraping ─────────────────────────────────────────────────────────────────


def fetch_listing() -> list[dict]:
    """
    Scrape the OPMCM cabinet decision category page and return all monthly
    PDF bundle entries as {pdf_url, content_url, month_label}.
    Each monthly bundle groups all cabinet decisions for that BS month into one PDF.
    """
    entries = []
    try:
        resp = httpx.get(
            LISTING_URL, headers=HEADERS, timeout=HTTP_TIMEOUT, follow_redirects=True
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        # Links appear as adjacent pairs: (PDF download, content page).
        # PDF links go to giwmscdntwo.gov.np CDN.
        # Content page links are relative /content/{id}/{slug}/.
        pending_pdf = None
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if href.startswith("/"):
                href = OPMCM_BASE + href

            if "giwmscdntwo.gov.np" in href and ".pdf" in href.lower():
                pending_pdf = href
            elif "/content/" in href and pending_pdf:
                entries.append(
                    {
                        "pdf_url": pending_pdf,
                        "content_url": href,
                        "month_label": _month_from_pdf_url(pending_pdf),
                    }
                )
                pending_pdf = None
            elif href not in ("javascript:void(0);", "#") and pending_pdf:
                # An unrelated link breaks the pair — reset
                if "/category/" not in href:
                    pending_pdf = None

        logger.info(f"Found {len(entries)} monthly cabinet decision bundles")
    except Exception as e:
        logger.warning(f"Failed to fetch OPMCM listing: {e}")

    return entries


def _month_from_pdf_url(pdf_url: str) -> str:
    """Derive a human-readable month label from a CDN PDF filename."""
    # e.g. giwmscdntwo.gov.np/media/pdf_upload/CABINET%202082%20Magh_97ulkfm.pdf
    filename = pdf_url.split("/")[-1].replace("%20", " ").upper()
    year_match = re.search(r"(\d{4})", filename)
    year = year_match.group(1) if year_match else "2082"
    for keyword, label in PDF_MONTH_KEYWORDS:
        if keyword in filename:
            return f"{label} {year}"
    return f"Unknown {year}"


# ── PDF Extraction ────────────────────────────────────────────────────────────


def is_already_processed(pdf_url: str) -> bool:
    """Return True if cabinet_decisions already has entries from this PDF."""
    result = (
        db.table("cabinet_decisions")
        .select("id", count="exact")
        .contains("metadata", {"source_pdf_url": pdf_url})
        .execute()
    )
    return (result.count or 0) > 0


def download_pdf_text(pdf_url: str) -> str | None:
    """Download a PDF from the CDN and extract text with pdfplumber."""
    try:
        resp = httpx.get(
            pdf_url, headers=HEADERS, timeout=HTTP_TIMEOUT, follow_redirects=True
        )
        resp.raise_for_status()
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            pages = [p.extract_text() for p in pdf.pages if p.extract_text()]
        text = "\n\n".join(pages)
        logger.info(f"Extracted {len(text)} chars from {pdf_url.split('/')[-1][:60]}")
        return text if text.strip() else None
    except Exception as e:
        logger.warning(f"PDF extraction failed ({pdf_url.split('/')[-1][:50]}): {e}")
        return None


# ── AI Parsing ────────────────────────────────────────────────────────────────


def extract_decisions_via_ai(text: str, month_label: str) -> list[dict]:
    """
    Parse individual cabinet decisions from a monthly PDF's text.
    Returns list of decision dicts.
    """
    truncated = text[:MAX_PDF_TEXT]
    if len(text) > MAX_PDF_TEXT:
        truncated += "\n[... truncated ...]"

    prompt = f"""The text below is from Nepal's Cabinet (मन्त्रिपरिषद्) official decisions for {month_label}.

Extract EACH individual decision as a JSON array. For each decision include:
- "title_np": Nepali title of the decision (copy from source, max 300 chars)
- "title_en": Brief English translation (max 150 chars)
- "summary_en": 1-2 sentence English summary of what was decided
- "category": one of: appointment, policy, law, budget, infrastructure, social_welfare, foreign_affairs, agreement, other
- "significance": one of: critical, high, medium, low
- "bp_items": list of RSP manifesto item IDs (bp-001 through bp-100) this decision relates to — empty list [] if none clearly apply
- "decision_date": ISO date (YYYY-MM-DD) if a specific date is mentioned in the text, otherwise null

Return ONLY a valid JSON array. No markdown, no preamble, no explanation.
If the text cannot be parsed into individual decisions, return [].

SOURCE TEXT:
{truncated}"""

    try:
        response = cheap_completion(
            prompt,
            system="You are a Nepal governance analyst. Extract cabinet decisions accurately from Nepali government documents.",
        )
        parsed = parse_ai_json(response, [])
        return parsed if isinstance(parsed, list) else []
    except Exception as e:
        logger.warning(f"AI decision extraction failed: {e}")
        return []


# ── Storage ───────────────────────────────────────────────────────────────────


def _get_manifesto_map() -> dict[str, str]:
    """Return {source_id: uuid} for all bp-* manifesto items."""
    result = (
        db.table("manifesto_items")
        .select("id, source_id")
        .like("source_id", "bp-%")
        .execute()
    )
    return {r["source_id"]: r["id"] for r in (result.data or [])}


def store_decisions(
    decisions: list[dict],
    pdf_url: str,
    content_url: str,
    month_label: str,
    manifesto_map: dict[str, str],
) -> int:
    """Insert decisions into cabinet_decisions and link to manifesto items."""
    created = 0
    today = datetime.now(timezone.utc).date().isoformat()

    for d in decisions:
        title_en = (d.get("title_en") or "").strip()
        title_np = (d.get("title_np") or "").strip()
        if not title_en and not title_np:
            continue

        decision_date = d.get("decision_date") or today
        # Validate date format
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(decision_date)):
            decision_date = today

        try:
            result = (
                db.table("cabinet_decisions")
                .insert(
                    {
                        "title_en": (title_en or title_np)[:400],
                        "title_np": title_np[:400] if title_np else None,
                        "summary_en": (d.get("summary_en") or "").strip() or None,
                        "category": d.get("category", "other"),
                        "significance": d.get("significance", "medium"),
                        "source_url": content_url,
                        "decision_date": decision_date,
                        "metadata": {
                            "source_pdf_url": pdf_url,
                            "month_label": month_label,
                            "ai_extracted": True,
                        },
                    }
                )
                .execute()
            )

            decision_id = result.data[0]["id"]
            created += 1

            # Link to manifesto items
            for bp_id in d.get("bp_items", []):
                manifesto_uuid = manifesto_map.get(str(bp_id))
                if manifesto_uuid:
                    try:
                        db.table("cabinet_decision_manifesto_links").insert(
                            {
                                "decision_id": decision_id,
                                "manifesto_item_id": manifesto_uuid,
                            }
                        ).execute()
                    except Exception:
                        pass  # Ignore duplicate link constraint errors

            logger.info(f"  Stored [{d.get('category', '?')}] {title_en[:80]}")
        except Exception as e:
            logger.warning(f"  Failed to store '{title_en[:60]}': {e}")

    return created


def _mark_pdf_as_processed(pdf_url: str, content_url: str, month_label: str):
    """Insert a placeholder row so we don't retry a PDF that yielded no decisions."""
    today = datetime.now(timezone.utc).date().isoformat()
    db.table("cabinet_decisions").insert(
        {
            "title_en": f"Cabinet Decisions — {month_label}",
            "decision_date": today,
            "source_url": content_url,
            "category": "other",
            "significance": "medium",
            "metadata": {
                "source_pdf_url": pdf_url,
                "month_label": month_label,
                "no_decisions_extracted": True,
            },
        }
    ).execute()


# ── Main ──────────────────────────────────────────────────────────────────────


def run_cabinet_decisions():
    """Checks OPMCM for new monthly decision PDFs."""
    run_id = log_agent_run("gazette_monitor")
    pdfs_processed = 0
    decisions_created = 0

    try:
        manifesto_map = _get_manifesto_map()
        listings = fetch_listing()

        for entry in listings:
            pdf_url = entry["pdf_url"]

            if is_already_processed(pdf_url):
                logger.debug(f"Already processed: {pdf_url.split('/')[-1][:60]}")
                continue

            logger.info(
                f"New bundle: {entry['month_label']} — {pdf_url.split('/')[-1][:60]}"
            )

            text = download_pdf_text(pdf_url)
            if not text:
                logger.warning("  PDF text extraction failed — marking as processed")
                _mark_pdf_as_processed(
                    pdf_url, entry["content_url"], entry["month_label"]
                )
                pdfs_processed += 1
                continue

            decisions = extract_decisions_via_ai(text, entry["month_label"])
            logger.info(
                f"  AI extracted {len(decisions)} decisions from {entry['month_label']}"
            )

            if decisions:
                n = store_decisions(
                    decisions,
                    pdf_url,
                    entry["content_url"],
                    entry["month_label"],
                    manifesto_map,
                )
                decisions_created += n
            else:
                _mark_pdf_as_processed(
                    pdf_url, entry["content_url"], entry["month_label"]
                )

            pdfs_processed += 1

        logger.info(
            f"Gazette Monitor: {pdfs_processed} PDFs processed, "
            f"{decisions_created} decisions stored"
        )
        complete_agent_run(run_id, "success", pdfs_processed, decisions_created)

    except Exception as e:
        logger.error(f"Gazette Monitor failed: {e}")
        complete_agent_run(run_id, "error", pdfs_processed, decisions_created, str(e))
        raise


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
