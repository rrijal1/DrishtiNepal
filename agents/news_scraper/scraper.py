"""
Drishti Nepal - News Scraper Agent
Runs every 30 minutes. Fetches news from whitelisted Nepali & English sources,
filters for cabinet/minister-related content, stores for processing.
"""

import json
import feedparser

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.config import NEWS_SOURCES
from agents.common.utils import (
    setup_logger,
    title_hash,
    log_agent_run,
    complete_agent_run,
    get_minister_names,
)

logger = setup_logger("news_scraper")

HEADERS = {"User-Agent": "DrishtiNepal/1.0 (https://drishtinepal.com)"}


def fetch_rss_feed(source: dict) -> list[dict]:
    """Parse an RSS feed and return structured entries."""
    if not source.get("rss_url"):
        return []
    try:
        feed = feedparser.parse(source["rss_url"])
        entries = []
        for entry in feed.entries[:20]:  # Limit per source
            entries.append(
                {
                    "source_name": source["name"],
                    "source_url": entry.get("link", ""),
                    "title": entry.get("title", "").strip(),
                    "body": entry.get("summary", "").strip(),
                    "published_at": entry.get("published", None),
                }
            )
        return entries
    except Exception as e:
        logger.error(f"Failed to fetch RSS from {source['name']}: {e}")
        return []


def is_relevant(title: str, body: str, minister_names: list[dict]) -> bool:
    """Check if a news item is relevant to cabinet/ministers using keyword matching."""
    text = (title + " " + body).lower()

    # Check minister names
    for minister in minister_names:
        if minister["name_en"].lower() in text or minister["name_np"] in text:
            return True

    # Check generic cabinet/government keywords
    keywords = [
        "cabinet",
        "minister",
        "ministry",
        "मन्त्री",
        "मन्त्रिपरिषद्",
        "मन्त्रालय",
        "cabinet decision",
        "राजपत्र",
        "सरकार",
        "रास्वपा",
        "rastriya swatantra",
        "rsp",
    ]
    return any(kw in text for kw in keywords)


def is_duplicate(t_hash: str) -> bool:
    """Check if this news title was already scraped."""
    result = (
        db.table("raw_news").select("id").eq("title_hash", t_hash).limit(1).execute()
    )
    return len(result.data) > 0


def extract_with_ai(title: str, body: str) -> dict | None:
    """Use AI to extract structured data from a news article."""
    prompt = f"""Extract structured information from this Nepali news article.

Title: {title}

Body (excerpt): {body[:1500]}

Return a JSON object with:
- "ministers_mentioned": list of minister names mentioned (empty list if none)
- "category": one of "decision", "statement", "policy", "legislation", "scandal", "achievement", "appointment", "other"
- "sentiment": one of "positive", "negative", "neutral", "mixed"
- "summary_en": 2-3 sentence English summary
- "summary_np": 2-3 sentence Nepali summary
- "is_cabinet_related": boolean - true if directly related to cabinet minister activities

Return ONLY valid JSON, no other text."""

    try:
        response = cheap_completion(prompt, max_tokens=512)
        # Extract JSON from response
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        return json.loads(response)
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"AI extraction failed: {e}")
        return None


def store_news_item(item: dict, ai_result: dict | None):
    """Store a scraped news item in the database."""
    db.table("raw_news").insert(
        {
            "source_name": item["source_name"],
            "source_url": item["source_url"],
            "title": item["title"],
            "body": item.get("body", ""),
            "published_at": item.get("published_at"),
            "title_hash": title_hash(item["title"]),
            "processed": False,
            "processing_result": ai_result,
        }
    ).execute()


def run():
    """Main entry point for the news scraper agent."""
    run_id = log_agent_run("news_scraper")
    items_processed = 0
    items_created = 0

    try:
        minister_names = get_minister_names()
        logger.info(f"Tracking {len(minister_names)} active ministers")

        for source in NEWS_SOURCES:
            logger.info(f"Fetching from {source['name']}...")

            if source["type"] == "rss":
                entries = fetch_rss_feed(source)
            else:
                logger.info(f"Skipping {source['name']} (scrape not yet implemented)")
                continue

            for entry in entries:
                items_processed += 1
                t_hash = title_hash(entry["title"])

                if is_duplicate(t_hash):
                    continue

                if not is_relevant(
                    entry["title"], entry.get("body", ""), minister_names
                ):
                    continue

                # AI extraction for relevant articles
                ai_result = extract_with_ai(entry["title"], entry.get("body", ""))
                store_news_item(entry, ai_result)
                items_created += 1
                logger.info(f"  Stored: {entry['title'][:80]}...")

        complete_agent_run(run_id, "success", items_processed, items_created)
        logger.info(
            f"Completed: {items_processed} processed, {items_created} new items stored"
        )

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_created, str(e))
        raise


if __name__ == "__main__":
    run()
