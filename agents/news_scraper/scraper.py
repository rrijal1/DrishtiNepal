"""
Drishti Nepal - News Scraper Agent
Runs on a schedule. Fetches news from whitelisted RSS sources concurrently,
filters for relevance, deduplicates across sources, checks for duplicates
in batches, and stores new items for later processing by other agents.
"""

import asyncio
import itertools
import re
import unicodedata
from typing import List, Dict

import feedparser
import httpx

from agents.common.db import db
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
MAX_ARTICLES_PER_FEED = 25
HTTP_TIMEOUT = 15  # seconds

# Same-outlet pairs: if both languages are scraped, keep only one per story
OUTLET_PAIRS = {
    "onlinekhabar": "onlinekhabar_en",
    "setopati": "setopati_en",
}


async def fetch_and_parse_rss_feed(
    client: httpx.AsyncClient, source: Dict
) -> List[Dict]:
    """Asynchronously fetch and parse an RSS feed."""
    if not source.get("rss_url"):
        return []
    url = source["rss_url"]
    try:
        response = await client.get(url, headers=HEADERS, timeout=HTTP_TIMEOUT)
        response.raise_for_status()

        # feedparser is synchronous, so run it in a thread to not block asyncio loop
        feed = await asyncio.to_thread(feedparser.parse, response.text)

        entries = []
        for entry in feed.entries[:MAX_ARTICLES_PER_FEED]:
            entries.append(
                {
                    "source_name": source["name"],
                    "source_url": entry.get("link", ""),
                    "title": entry.get("title", "").strip(),
                    "body": entry.get("summary", "").strip(),
                    "published_at": entry.get("published", None),
                }
            )
        logger.info(f"Fetched {len(entries)} entries from {source['name']}")
        return entries
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching {url} for {source['name']}: {e}")
    except Exception as e:
        logger.error(f"Failed to fetch/parse RSS from {source['name']}: {e}")
    return []


def is_relevant(title: str, body: str, minister_names: List[Dict]) -> bool:
    """Check if a news item is relevant to cabinet/ministers.

    Tightened filter: must match a minister name, OR match at least 2 political keywords.
    This avoids wasting AI calls on tangentially political news (cricket, stock market, etc.)
    """
    text = (title + " " + (body or "")).lower()

    # Check minister names — instant relevance
    for minister in minister_names:
        if minister["name_en"].lower() in text or minister["name_np"] in text:
            return True

    # Require 2+ keyword matches (not just one generic word like सरकार)
    keywords = [
        "cabinet",
        "minister",
        "ministry",
        "मन्त्री",
        "मन्त्रिपरिषद्",
        "मन्त्रालय",
        "cabinet decision",
        "राजपत्र",
        "रास्वपा",
        "rastriya swatantra",
        "rsp",
        "prime minister",
        "प्रधानमन्त्री",
        "parliament",
        "संसद",
        "विधेयक",
        "budget",
        "बजेट",
    ]
    matches = sum(1 for kw in keywords if kw in text)
    return matches >= 2


def _normalize_url_slug(url: str) -> str:
    """Extract the article slug/path from a URL for cross-source matching."""
    if not url:
        return ""
    # Strip protocol, domain, query params — keep the path
    url = re.sub(r"^https?://[^/]+", "", url)
    url = re.sub(r"\?.*$", "", url)
    return url.strip("/")


def _dedup_across_sources(entries: List[Dict]) -> List[Dict]:
    """Remove duplicate articles from the same outlet's bilingual feeds.

    When onlinekhabar (np) and onlinekhabar_en (en) both carry the same story,
    keep the English version (better for AI analysis) and drop the Nepali one.
    Also dedup exact same URL across any sources.
    """
    # Phase 1: URL-based dedup (exact same article)
    seen_urls = {}
    deduped = []
    for entry in entries:
        url = entry.get("source_url", "")
        if url in seen_urls:
            continue
        seen_urls[url] = True
        deduped.append(entry)

    dropped_url = len(entries) - len(deduped)
    if dropped_url:
        logger.info(f"  URL dedup: dropped {dropped_url} exact duplicates")

    # Phase 2: Same-outlet cross-language dedup via URL slug similarity
    # Group by outlet pair, then match slugs
    paired_entries = {}  # slug -> entry (prefer English)
    unpaired = []

    paired_source_names = set()
    for np_name, en_name in OUTLET_PAIRS.items():
        paired_source_names.add(np_name)
        paired_source_names.add(en_name)

    for entry in deduped:
        source = entry["source_name"]
        if source not in paired_source_names:
            unpaired.append(entry)
            continue

        slug = _normalize_url_slug(entry.get("source_url", ""))
        # Use source_name + last 2 path segments as key
        segments = slug.rsplit("/", 2)
        key = segments[-1] if segments else slug

        if not key:
            unpaired.append(entry)
            continue

        # Find the base outlet name
        base_outlet = source
        for np_name, en_name in OUTLET_PAIRS.items():
            if source in (np_name, en_name):
                base_outlet = np_name
                break

        group_key = f"{base_outlet}:{key}"
        existing = paired_entries.get(group_key)
        if existing is None:
            paired_entries[group_key] = entry
        else:
            # Prefer English version
            if "_en" in source:
                paired_entries[group_key] = entry
            # elif existing is already English, keep it

    result = unpaired + list(paired_entries.values())
    dropped_cross = len(deduped) - len(result)
    if dropped_cross:
        logger.info(
            f"  Cross-language dedup: dropped {dropped_cross} bilingual duplicates"
        )

    return result


def store_news_items(items: List[Dict]):
    """Store scraped news items in the database in a single batch."""
    if not items:
        return

    result = db.table("raw_news").insert(items).execute()
    logger.info(f"Successfully stored {len(result.data)} new items in database.")


async def run():
    """Main entry point for the news scraper agent."""
    run_id = log_agent_run("news_scraper")
    total_articles_fetched = 0
    total_new_items_stored = 0

    try:
        minister_names = get_minister_names()
        logger.info(f"Tracking {len(minister_names)} active ministers")

        rss_sources = [s for s in NEWS_SOURCES if s.get("type") == "rss"]

        async with httpx.AsyncClient() as client:
            fetch_tasks = [
                fetch_and_parse_rss_feed(client, source) for source in rss_sources
            ]
            all_entries_nested = await asyncio.gather(*fetch_tasks)

        all_entries = list(itertools.chain.from_iterable(all_entries_nested))
        total_articles_fetched = len(all_entries)
        logger.info(
            f"Fetched a total of {total_articles_fetched} articles from {len(rss_sources)} sources."
        )

        if not all_entries:
            complete_agent_run(run_id, "success", 0, 0)
            logger.info("No articles found in this run.")
            return

        # Cross-source dedup (same story on np + en feed of same outlet)
        all_entries = _dedup_across_sources(all_entries)
        logger.info(f"After cross-source dedup: {len(all_entries)} unique articles.")

        # Batch duplicate check
        for entry in all_entries:
            entry["title_hash"] = title_hash(entry["title"])

        hashes_to_check = [entry["title_hash"] for entry in all_entries]
        result = (
            db.table("raw_news")
            .select("title_hash")
            .in_("title_hash", hashes_to_check)
            .execute()
        )
        existing_hashes = {item["title_hash"] for item in result.data}
        logger.info(f"Found {len(existing_hashes)} existing articles in database.")

        # Filter out duplicates and irrelevant articles
        new_items_to_store = []
        for entry in all_entries:
            if entry["title_hash"] in existing_hashes:
                continue
            if not is_relevant(entry["title"], entry.get("body", ""), minister_names):
                continue

            # Add fields for database insertion
            entry["processed"] = False
            entry["processing_result"] = (
                None  # This will be filled by the generator agent
            )
            new_items_to_store.append(entry)

        # Store all new items at once
        store_news_items(new_items_to_store)
        total_new_items_stored = len(new_items_to_store)

        complete_agent_run(
            run_id, "success", total_articles_fetched, total_new_items_stored
        )
        logger.info(
            f"Completed: {total_articles_fetched} processed, {total_new_items_stored} new items stored"
        )

    except Exception as e:
        logger.error(f"Agent failed: {e}", exc_info=True)
        complete_agent_run(
            run_id, "error", total_articles_fetched, total_new_items_stored, str(e)
        )
        raise


if __name__ == "__main__":
    asyncio.run(run())
