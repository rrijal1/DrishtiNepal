"""
Drishti Nepal — Parliament Tracker

Scrapes the House of Representatives notice board daily:
  https://hr.parliament.gov.np/np/parliamentary-notices

Downloads new notice PDFs, extracts Nepali text, classifies with AI,
and stores structured records in parliament_records.

Schedule: Daily (run more frequently during active sessions)
Source:   House of Representatives Secretariat (hr.parliament.gov.np)
Output:   parliament_records
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
    get_minister_map,
)

logger = setup_logger("parliament_tracker")

PARL_BASE = "https://hr.parliament.gov.np"
NOTICES_URL = f"{PARL_BASE}/np/parliamentary-notices"
HEADERS = {
    "User-Agent": "DrishtiNepal/1.0 (https://drishtinepal.com; public interest accountability project)",
    "Accept-Language": "ne,en;q=0.9",
}
HTTP_TIMEOUT = 90
MAX_PDF_TEXT = 8000
MAX_NOTICES_PER_RUN = 15  # Avoid overwhelming the source server


# ── Scraping ─────────────────────────────────────────────────────────────────


def fetch_notice_listing(pages: int = 2) -> list[dict]:
    """
    Scrape parliament notice listing pages.
    Returns list of {notice_id, title_np, url, notice_type}.
    """
    notices = []
    seen_ids: set[str] = set()

    for page_num in range(1, pages + 1):
        url = NOTICES_URL if page_num == 1 else f"{NOTICES_URL}?page={page_num}"
        try:
            resp = httpx.get(
                url, headers=HEADERS, timeout=HTTP_TIMEOUT, follow_redirects=True
            )
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")

            page_notices = 0
            for a in soup.find_all("a", href=True):
                href = a["href"].strip()
                m = re.search(r"/np/notices/(\d+)", href)
                if not m:
                    continue

                notice_id = m.group(1)
                if notice_id in seen_ids:
                    continue
                seen_ids.add(notice_id)

                title_np = a.get_text(strip=True)
                # Skip the "पढ्नुहोस्" (Read) button links — use the title link
                if title_np == "पढ्नुहोस्" or not title_np:
                    continue

                if not href.startswith("http"):
                    href = PARL_BASE + href

                notices.append({
                    "notice_id": notice_id,
                    "title_np": title_np,
                    "url": href,
                    "notice_type": _classify_title_heuristic(title_np),
                })
                page_notices += 1

            logger.info(f"Found {page_notices} new notices on page {page_num}")
        except Exception as e:
            logger.warning(f"Failed to fetch parliament notices page {page_num}: {e}")
            break

    return notices


def _classify_title_heuristic(title_np: str) -> str:
    """Quick heuristic classification from Nepali title keywords."""
    if "कार्यसूची" in title_np:
        return "notice"   # Daily agenda
    if "सूचनापत्र" in title_np:
        return "notice"   # Bulletin
    if "विधेयक" in title_np:
        return "bill"
    if "समिति" in title_np:
        return "committee_report"
    if "प्रश्न" in title_np:
        return "question_answer"
    if "मतदान" in title_np or "निर्वाचन" in title_np:
        return "vote"
    if "प्रस्ताव" in title_np or "प्रतिवेदन" in title_np:
        return "resolution"
    return "notice"


def is_already_processed(notice_id: str) -> bool:
    """Return True if this notice ID already exists in parliament_records."""
    result = (
        db.table("parliament_records")
        .select("id", count="exact")
        .contains("metadata", {"parliament_notice_id": notice_id})
        .execute()
    )
    return (result.count or 0) > 0


def fetch_notice_pdf_url(notice_url: str) -> str | None:
    """Fetch the notice detail page and return the PDF attachment URL."""
    try:
        resp = httpx.get(
            notice_url, headers=HEADERS, timeout=HTTP_TIMEOUT, follow_redirects=True
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if ".pdf" in href.lower() and "parliament.gov.np" in href:
                return href
    except Exception as e:
        logger.warning(f"Failed to get notice detail from {notice_url}: {e}")
    return None


def download_pdf_text(pdf_url: str) -> str | None:
    """Download a PDF and extract text with pdfplumber."""
    try:
        resp = httpx.get(
            pdf_url, headers=HEADERS, timeout=HTTP_TIMEOUT, follow_redirects=True
        )
        resp.raise_for_status()
        with pdfplumber.open(io.BytesIO(resp.content)) as pdf:
            pages = [p.extract_text() for p in pdf.pages if p.extract_text()]
        text = "\n\n".join(pages)
        logger.info(
            f"Extracted {len(text)} chars from {pdf_url.split('/')[-1][:50]}"
        )
        return text if text.strip() else None
    except Exception as e:
        logger.warning(f"PDF extraction failed ({pdf_url.split('/')[-1][:50]}): {e}")
        return None


# ── AI Classification ─────────────────────────────────────────────────────────


def classify_notice_via_ai(
    title_np: str, text: str | None, notice_type: str
) -> dict:
    """Classify and summarize a parliament notice using AI."""
    content_preview = (text[:MAX_PDF_TEXT] if text else "").strip()

    prompt = f"""Analyze this Nepal Parliament (प्रतिनिधि सभा) record.

Notice title (Nepali): {title_np}
Type hint: {notice_type}
Content:
{content_preview or "(PDF text unavailable — classify from title only)"}

Return a JSON object with:
- "title_en": English translation of the title (max 200 chars)
- "summary_en": 1-2 sentence English summary of what this notice covers
- "record_type": one of: bill, committee_report, question_answer, vote, resolution, speech, notice
- "significance": one of: critical, high, medium, low
- "bp_items": list of manifesto item IDs (bp-001 through bp-100) this relates to — [] if none apply
- "bs_date": Bikram Sambat date mentioned (format: YYYY-MM-DD), or null

Return ONLY the JSON object, no markdown."""

    try:
        response = cheap_completion(
            prompt,
            system="You are a Nepal parliament analyst. Classify parliamentary records accurately.",
        )
        fallback = {
            "title_en": title_np[:200],
            "summary_en": "",
            "record_type": notice_type,
            "significance": "medium",
            "bp_items": [],
            "bs_date": None,
        }
        return parse_ai_json(response, fallback) or fallback
    except Exception as e:
        logger.warning(f"AI notice classification failed: {e}")
        return {
            "title_en": title_np[:200],
            "summary_en": "",
            "record_type": notice_type,
            "significance": "medium",
            "bp_items": [],
            "bs_date": None,
        }


def _find_related_minister(
    text: str, minister_map: dict[str, str]
) -> str | None:
    """Return minister UUID if any minister name appears in the text."""
    text_lower = text.lower()
    for name, mid in minister_map.items():
        parts = name.split()
        if any(len(p) > 3 and p.lower() in text_lower for p in parts):
            return mid
    return None


# ── Storage ───────────────────────────────────────────────────────────────────


def store_parliament_record(
    notice: dict,
    classification: dict,
    pdf_url: str | None,
    manifesto_map: dict[str, str],
    minister_map: dict[str, str],
) -> str | None:
    """Insert a parliament record."""
    # Pick first matching manifesto item
    manifesto_item_id = None
    for bp_id in classification.get("bp_items", []):
        if isinstance(bp_id, str) and bp_id in manifesto_map:
            manifesto_item_id = manifesto_map[bp_id]
            break

    combined_text = notice["title_np"] + " " + classification.get("title_en", "")
    related_minister = _find_related_minister(combined_text, minister_map)

    significance = classification.get("significance", "medium")
    record_type = classification.get("record_type", "notice")

    try:
        result = db.table("parliament_records").insert({
            "record_type": record_type,
            "chamber": "house",
            "record_date": datetime.now(timezone.utc).date().isoformat(),
            "title_en": classification.get("title_en", notice["title_np"])[:400],
            "title_np": notice["title_np"][:400],
            "summary_en": classification.get("summary_en") or None,
            "source_url": notice["url"],
            "status": "recorded",
            "manifesto_item_id": manifesto_item_id,
            "related_minister_id": related_minister,
            "ai_summary": classification.get("summary_en") or None,
            "review_status": (
                "needs_review"
                if significance in ("critical", "high")
                or record_type in ("bill", "vote")
                else "auto_published"
            ),
            "metadata": {
                "parliament_notice_id": notice["notice_id"],
                "pdf_url": pdf_url,
                "bs_date": classification.get("bs_date"),
            },
        }).execute()
        return result.data[0]["id"]
    except Exception as e:
        logger.warning(
            f"Failed to store parliament record '{notice['title_np'][:60]}': {e}"
        )
        return None


# ── Main ──────────────────────────────────────────────────────────────────────


def run():
    """Main entry point. Checks parliament notice board for new records."""
    run_id = log_agent_run("parliament_tracker")
    notices_processed = 0
    records_created = 0

    try:
        manifesto_map = {
            r["source_id"]: r["id"]
            for r in (
                db.table("manifesto_items")
                .select("id, source_id")
                .like("source_id", "bp-%")
                .execute()
                .data or []
            )
        }
        minister_map = get_minister_map(lowercase_keys=True)

        notices = fetch_notice_listing(pages=2)
        new_notices = [n for n in notices if not is_already_processed(n["notice_id"])]
        logger.info(
            f"Found {len(new_notices)} new notices (of {len(notices)} total)"
        )

        for notice in new_notices[:MAX_NOTICES_PER_RUN]:
            notices_processed += 1
            logger.info(f"Processing: {notice['title_np'][:80]}")

            pdf_url = fetch_notice_pdf_url(notice["url"])
            text = download_pdf_text(pdf_url) if pdf_url else None

            classification = classify_notice_via_ai(
                notice["title_np"], text, notice["notice_type"]
            )

            record_id = store_parliament_record(
                notice, classification, pdf_url, manifesto_map, minister_map
            )
            if record_id:
                records_created += 1
                logger.info(
                    f"  Stored [{classification.get('record_type', '?')}] "
                    f"{classification.get('title_en', '')[:80]} "
                    f"({classification.get('significance', '?')})"
                )

        logger.info(
            f"Parliament Tracker: {records_created} records "
            f"from {notices_processed} notices processed"
        )
        complete_agent_run(run_id, "success", notices_processed, records_created)

    except Exception as e:
        logger.error(f"Parliament Tracker failed: {e}")
        complete_agent_run(run_id, "error", notices_processed, records_created, str(e))
        raise
