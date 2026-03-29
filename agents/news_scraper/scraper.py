"""
Drishti Nepal - News Scraper Agent
Runs on a schedule. Fetches news from whitelisted RSS sources concurrently,
filters for relevance, checks for duplicates in batches, and stores new
items for later processing by other agents.
"""

import asyncio
import itertools
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
    """Check if a news item is relevant to cabinet/ministers using keyword matching."""
    text = (title + " " + (body or "")).lower()

    # Check minister names
    for minister in minister_names:
        if minister["name_en"].lower() in text or minister["name_np"] in text:
            return True

    # Check generic cabinet/government keywords
    keywords = [
        "cabinet", "minister", "ministry", "मन्त्री", "मन्त्रिपरिषद्",
        "मन्त्रालय", "cabinet decision", "राजपत्र", "सरकार", "रास्वपा",
        "rastriya swatantra", "rsp", "prime minister", "प्रधानमन्त्री",
    ]
    return any(kw in text for kw in keywords)


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
            fetch_tasks = [fetch_and_parse_rss_feed(client, source) for source in rss_sources]
            all_entries_nested = await asyncio.gather(*fetch_tasks)
        
        all_entries = list(itertools.chain.from_iterable(all_entries_nested))
        total_articles_fetched = len(all_entries)
        logger.info(f"Fetched a total of {total_articles_fetched} articles from {len(rss_sources)} sources.")

        if not all_entries:
            complete_agent_run(run_id, "success", 0, 0)
            logger.info("No articles found in this run.")
            return

        # Batch duplicate check
        for entry in all_entries:
            entry['title_hash'] = title_hash(entry['title'])
        
        hashes_to_check = [entry['title_hash'] for entry in all_entries]
        result = db.table("raw_news").select("title_hash").in_("title_hash", hashes_to_check).execute()
        existing_hashes = {item['title_hash'] for item in result.data}
        logger.info(f"Found {len(existing_hashes)} existing articles in database.")

        # Filter out duplicates and irrelevant articles
        new_items_to_store = []
        for entry in all_entries:
            if entry['title_hash'] in existing_hashes:
                continue
            if not is_relevant(entry["title"], entry.get("body", ""), minister_names):
                continue
            
            # Add fields for database insertion
            entry['processed'] = False
            entry['processing_result'] = None # This will be filled by the generator agent
            new_items_to_store.append(entry)

        # Store all new items at once
        store_news_items(new_items_to_store)
        total_new_items_stored = len(new_items_to_store)

        complete_agent_run(run_id, "success", total_articles_fetched, total_new_items_stored)
        logger.info(
            f"Completed: {total_articles_fetched} processed, {total_new_items_stored} new items stored"
        )

    except Exception as e:
        logger.error(f"Agent failed: {e}", exc_info=True)
        complete_agent_run(run_id, "error", total_articles_fetched, total_new_items_stored, str(e))
        raise


if __name__ == "__main__":
    asyncio.run(run())
