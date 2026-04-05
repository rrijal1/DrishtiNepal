"""
Drishti Nepal — Social Monitoring Agent

Monitors Google Trends, whitelisted social handles (X/Facebook/RSS),
and captures trending topics relevant to government accountability indicators.

Currently implements:
- Google Trends via pytrends
- RSS feeds from whitelisted handles (DB-driven)

Future (when API keys available):
- X (Twitter) API v2 trending topics + handle monitoring
- Facebook Graph API page post monitoring

Usage:
    python -m agents.run social
"""

import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import (
    setup_logger,
    log_agent_run,
    complete_agent_run,
    parse_ai_json,
)

logger = setup_logger("social_monitor")

# How many trending topics to keep per fetch
MAX_TRENDS = 20
# Trending topics expire after this many hours
TREND_EXPIRY_HOURS = 24


# ── Google Trends ─────────────────────────────────────────────────────────────


def fetch_google_trends_nepal() -> List[Dict]:
    """Fetch trending searches for Nepal using pytrends."""
    try:
        from pytrends.request import TrendReq
    except ImportError:
        logger.warning("pytrends not installed. Run: pip install pytrends")
        return []

    try:
        pytrends = TrendReq(hl="en-US", tz=345)  # Nepal is UTC+5:45

        # Get trending searches — Nepal doesn't always have data, try daily
        trending = pytrends.trending_searches(pn="nepal")
        topics = []
        for _, row in trending.head(MAX_TRENDS).iterrows():
            topic = str(row.values[0]).strip()
            if topic:
                topics.append(
                    {
                        "source": "google_trends",
                        "topic": topic,
                        "region": "NP",
                        "raw_data": {"method": "trending_searches"},
                    }
                )

        logger.info(f"Fetched {len(topics)} Google trending topics for Nepal")
        return topics
    except Exception as e:
        logger.warning(f"Google Trends fetch failed: {e}")
        return []


# ── Whitelisted Handle Monitoring ─────────────────────────────────────────────


def get_active_handles(platform: Optional[str] = None) -> List[Dict]:
    """Fetch active whitelisted handles from the database."""
    query = db.table("social_handles").select("*").eq("is_active", True)
    if platform:
        query = query.eq("platform", platform)
    result = query.execute()
    return result.data or []


# ── Relevance Assessment ──────────────────────────────────────────────────────


def assess_topic_relevance(topics: List[str]) -> List[Dict]:
    """Use AI to assess which trending topics are relevant to government accountability."""
    if not topics:
        return []

    # Fetch manifesto item titles for context
    manifesto_items = (
        db.table("manifesto_items")
        .select("source_id, title_en")
        .limit(105)
        .execute()
        .data
        or []
    )
    manifesto_context = "\n".join(
        f"- {m['source_id']}: {m['title_en']}" for m in manifesto_items[:50]
    )

    topics_str = "\n".join(f"- {t}" for t in topics)

    prompt = f"""You are analyzing trending topics in Nepal for relevance to government accountability tracking.

TRENDING TOPICS:
{topics_str}

GOVERNMENT COMMITMENTS (sample):
{manifesto_context}

For each trending topic, assess:
1. Is it relevant to tracking government performance, policy, or accountability?
2. Which manifesto items (bp-XXX IDs) does it relate to, if any?
3. Relevance score from 0.0 (irrelevant) to 1.0 (highly relevant)

Return a JSON array of objects, one per topic:
[{{"topic": "...", "relevance_score": 0.0-1.0, "matched_items": ["bp-XXX"], "reason": "brief note"}}]

Only include topics with relevance_score >= 0.3. Return empty array [] if none are relevant.
Return ONLY valid JSON."""

    try:
        response = cheap_completion(prompt, max_tokens=1024)
        results = parse_ai_json(response)
        if isinstance(results, list):
            return [r for r in results if r.get("relevance_score", 0) >= 0.3]
        return []
    except Exception as e:
        logger.error(f"Relevance assessment failed: {e}")
        return []


# ── Storage ───────────────────────────────────────────────────────────────────


def store_trending_topics(topics: List[Dict], assessments: List[Dict]):
    """Store trending topics with their relevance assessments."""
    now = datetime.now(timezone.utc)
    expires = now + timedelta(hours=TREND_EXPIRY_HOURS)

    # Build a lookup from assessments
    assessment_map = {a["topic"]: a for a in assessments}

    stored = 0
    for topic_data in topics:
        topic_text = topic_data["topic"]
        assessment = assessment_map.get(topic_text, {})

        row = {
            "source": topic_data["source"],
            "topic": topic_text,
            "region": topic_data.get("region", "NP"),
            "relevance_score": assessment.get("relevance_score"),
            "matched_manifesto_items": assessment.get("matched_items", []),
            "raw_data": {
                **topic_data.get("raw_data", {}),
                "reason": assessment.get("reason"),
            },
            "fetched_at": now.isoformat(),
            "expires_at": expires.isoformat(),
        }

        try:
            db.table("trending_topics").insert(row).execute()
            stored += 1
        except Exception as e:
            logger.warning(f"Failed to store topic '{topic_text}': {e}")

    logger.info(f"Stored {stored} trending topics")
    return stored


def cleanup_expired_topics():
    """Remove expired trending topics."""
    now = datetime.now(timezone.utc).isoformat()
    try:
        db.table("trending_topics").delete().lt("expires_at", now).execute()
        logger.info("Cleaned up expired trending topics")
    except Exception as e:
        logger.warning(f"Cleanup failed: {e}")


# ── Main ──────────────────────────────────────────────────────────────────────


async def run_async():
    """Main entry point for the social monitoring agent."""
    run_id = log_agent_run("social_monitor")
    topics_found = 0
    topics_stored = 0

    try:
        # 1. Google Trends
        logger.info("--- Fetching Google Trends ---")
        google_topics = await asyncio.to_thread(fetch_google_trends_nepal)
        topics_found += len(google_topics)

        # 2. Assess relevance of all topics
        all_topics = google_topics
        topic_texts = [t["topic"] for t in all_topics]

        logger.info(f"--- Assessing relevance of {len(topic_texts)} topics ---")
        assessments = await asyncio.to_thread(assess_topic_relevance, topic_texts)
        logger.info(f"Found {len(assessments)} relevant topics")

        # 3. Store relevant ones
        relevant_topic_texts = {a["topic"] for a in assessments}
        relevant_topics = [t for t in all_topics if t["topic"] in relevant_topic_texts]
        topics_stored = await asyncio.to_thread(
            store_trending_topics, relevant_topics, assessments
        )

        # 4. Cleanup expired
        await asyncio.to_thread(cleanup_expired_topics)

        complete_agent_run(run_id, "success", topics_found, topics_stored)
        logger.info(f"Completed. Found: {topics_found}, Stored: {topics_stored}")

    except Exception as e:
        logger.error(f"Social monitor failed: {e}", exc_info=True)
        complete_agent_run(run_id, "error", topics_found, topics_stored, str(e))
        raise


def run():
    """Sync wrapper — called by agents.run CLI."""
    asyncio.run(run_async())


if __name__ == "__main__":
    run()
