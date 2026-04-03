"""
Drishti Nepal - Content Generator Agent
A two-stage agent that first performs a preliminary AI analysis on raw news,
then transforms the analyzed news into publishable posts.
"""

import asyncio
import json
import re
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

logger = setup_logger("content_generator")

# Concurrency limit for AI calls (respect rate limits on free-tier NVIDIA NIM)
AI_CONCURRENCY = 5
# Max items to analyze per run — keeps each run under 10 minutes
ANALYSIS_BATCH_LIMIT = 25
# How far back to look for unprocessed news (rolling window, not beginning of time)
LOOKBACK_DAYS = 3


# This function is moved from the scraper agent
def extract_with_ai(title: str, body: str, minister_names: List[str]) -> Optional[Dict]:
    """Use AI to extract structured data from a news article."""
    ministers_str = ", ".join(minister_names)
    prompt = f"""Extract structured information from this Nepali news article.

CURRENT CABINET MINISTERS:
{ministers_str}

Title: {title}

Body (excerpt): {(body or "")[:2000]}

Return a JSON object with:
- "ministers_mentioned": ONLY names from the list above that are mentioned in the article (empty list if none)
- "category": one of "decision", "statement", "policy", "legislation", "scandal", "achievement", "appointment", "other"
- "sentiment": one of "positive", "negative", "neutral", "mixed"
- "summary_en": 2-3 sentence English summary
- "summary_np": 2-3 sentence Nepali summary
- "is_cabinet_related": boolean - true if directly related to activities of the CURRENT cabinet ministers listed above

Return ONLY valid JSON, no other text."""

    try:
        response = cheap_completion(prompt, max_tokens=768)
        return parse_ai_json(response)
    except Exception as e:
        logger.error(f"AI extraction failed for title '{title[:50]}...': {e}")
        return None


async def _analyze_one(
    item: Dict, minister_names: List[str], semaphore: asyncio.Semaphore
) -> bool:
    """Analyze a single item with concurrency control."""
    async with semaphore:
        try:
            ai_result = await asyncio.to_thread(
                extract_with_ai, item["title"], item.get("body"), minister_names
            )
            if ai_result:
                await asyncio.to_thread(
                    lambda: db.table("raw_news")
                    .update({"processing_result": ai_result})
                    .eq("id", item["id"])
                    .execute()
                )
                logger.info(f"  Analyzed: {item['title'][:70]}...")
                return True
        except Exception as e:
            logger.error(f"  Failed for {item['id']}: {e}")
    return False


def _get_cutoff_date() -> str:
    """Rolling window: only process news from the last N days."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)
    return cutoff.isoformat()


async def run_initial_analysis(limit: int = None) -> int:
    """
    Stage 1: Fetch newly scraped articles and enrich them with an initial AI analysis.
    Uses concurrent AI calls (controlled by AI_CONCURRENCY) to stay within timeout.
    """
    if limit is None:
        limit = ANALYSIS_BATCH_LIMIT

    logger.info("--- Stage 1: Running Initial AI Analysis ---")

    from agents.common.utils import get_minister_names

    ministers_data = get_minister_names()
    minister_names = [m["name_en"] for m in ministers_data]

    cutoff = _get_cutoff_date()
    logger.info(f"Looking back to {cutoff}")

    newly_scraped_items = (
        db.table("raw_news")
        .select("id, title, body")
        .is_("processing_result", "null")
        .eq("processed", False)
        .gte("scraped_at", cutoff)
        .limit(limit)
        .execute()
    ).data

    if not newly_scraped_items:
        logger.info("No new items to analyze.")
        return 0

    logger.info(
        f"Found {len(newly_scraped_items)} items. Processing {AI_CONCURRENCY} at a time..."
    )
    semaphore = asyncio.Semaphore(AI_CONCURRENCY)
    results = await asyncio.gather(
        *[_analyze_one(item, minister_names, semaphore) for item in newly_scraped_items]
    )
    items_analyzed = sum(1 for r in results if r)

    logger.info(
        f"Completed analysis. {items_analyzed}/{len(newly_scraped_items)} items updated."
    )
    return items_analyzed


def fetch_analyzed_news(limit: int = 20) -> List[Dict]:
    """Get analyzed news items that haven't been turned into posts yet."""
    cutoff = _get_cutoff_date()

    result = (
        db.table("raw_news")
        .select("*")
        .eq("processed", False)
        .is_("duplicate_of", "null")
        .not_.is_("processing_result", "null")
        .gte("scraped_at", cutoff)
        .order("scraped_at", desc=False)
        .limit(limit)
        .execute()
    )
    return result.data


def generate_post_content(news_items: List[Dict]) -> Optional[Dict]:
    """Generate a publishable post from one or more analyzed news items."""
    if not news_items:
        return None

    context = "\n\n".join(
        [
            f"Source: {item['source_name']}\nTitle: {item['title']}\nBody: {(item.get('body') or '')[:800]}\nAI Analysis: {json.dumps(item.get('processing_result') or {})}"
            for item in news_items
        ]
    )

    prompt = f"""You are writing for Drishti Nepal (दृष्टि नेपाल) — a citizen-led political accountability portal. Your readers are smart, skeptical Nepalis who distrust all political propaganda equally.

NEWS ITEMS:
{context}

Generate a JSON response with:
- "title_en": Sharp, specific English headline. No clickbait, but make it compelling. Use active voice. Name the minister/actor when relevant.
- "title_np": Same headline in natural Nepali (Devanagari). Not a robotic translation — write how a Nepali journalist would write it.
- "body_en": 200-400 word article in English (Markdown). Structure: lead with the most important fact, then context, then what it means for accountability. If a manifesto promise is relevant, reference it. End with what to watch next.
- "body_np": Same article in natural Nepali. Devanagari script, but technical/English-origin words (budget, GDP, infrastructure, policy) stay in English. Core political vocab in Nepali: मन्त्री, सरकार, प्रतिबद्धता, वचनपत्र.
- "excerpt_en": 1-2 sentence hook. Write it like a tweet — make people want to click. Can be a question.
- "excerpt_np": Same hook in natural Nepali.
- "social_hook": A single punchy line (under 100 chars) for social media — a question, a stat, or a challenge. E.g., "500,000 jobs promised. How many so far?" or "के यो वचन पूरा हुन्छ?"
- "tags": list of relevant tags (e.g., ["economy", "cabinet-decision", "minister-name"])
- "bp_items": list of Bachha Patra IDs this article directly relates to (e.g., ["bp-001", "bp-023"]). Use only IDs you are confident about from the news content. Empty list is fine.
- "type": one of "news_update", "analysis", "cabinet_decision"
- "auto_publishable": boolean - true only if purely factual with high confidence

WRITING RULES:
- Be factual and sourced, but NOT boring. Accountability journalism should engage citizens, not put them to sleep.
- Attribute claims to sources.
- When relevant, contrast what was promised vs. what happened.
- Never editorialize or give opinions. Let the facts speak, but present them sharply.
- Vary your style: some posts are short punches, others are detailed explainers.

ANTI-AI WRITING (CRITICAL — if the output reads like AI, it fails):
- NEVER use em dashes (—). Use commas, periods, or break into two sentences.
- BANNED words/phrases: "Furthermore", "Moreover", "It's worth noting", "Notably", "Indeed", "In essence", "comprehensive", "robust", "pivotal", "crucial", "underscores", "landscape", "navigating", "multifaceted", "nuanced", "fostering", "It remains to be seen", "Only time will tell", "In a move that".
- Use contractions naturally: "don't", "can't", "won't", "hasn't", "it's".
- Don't over-polish. Real journalism has personality. Short paragraphs. Sentence fragments sometimes.
- The excerpt and social_hook should sound like a human typed them in 5 seconds, not crafted them for an hour.
- Nepali text should sound like how people actually talk/write on Nepali Twitter, not like a textbook.

Return ONLY valid JSON."""

    try:
        response = cheap_completion(prompt, max_tokens=2048)
        return parse_ai_json(response)
    except Exception as e:
        logger.error(f"Content generation failed: {e}")
        return None


def create_slug(title: str) -> str:
    """Generate URL slug from title."""
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    slug = slug[:80].rstrip("-")
    date_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"{date_prefix}-{slug}"


def store_post(content: Dict, source_item: Dict):
    """Create a post entry in the database."""
    auto_publish = content.get("auto_publishable", False)
    status = "published" if auto_publish else "review"

    # Merge bp_items (manifesto item IDs) into tags so manifesto pages can query them
    tags = list(content.get("tags", []))
    bp_items = content.get("bp_items", [])
    if bp_items:
        tags = list(set(tags) | set(bp_items))

    post_data = {
        "category": content.get("type", "news_update"),
        "slug": create_slug(content["title_en"]),
        "title_en": content["title_en"],
        "title_np": content.get("title_np", ""),
        "content_en": content["body_en"],
        "content_np": content.get("body_np", ""),
        "excerpt_en": content.get("excerpt_en", ""),
        "excerpt_np": content.get("excerpt_np", ""),
        "ai_generated": True,
        "tags": tags,
        "author_type": "agent",
        "author_name": "Drishti Nepal AI",
        "status": status,
        "published_at": (
            datetime.now(timezone.utc).isoformat() if auto_publish else None
        ),
        # Pass through source info
        "source_url": source_item.get("source_url"),
        "metadata": {
            "social_hook": content.get("social_hook", ""),
            "source_name": source_item.get("source_name"),
        },
    }

    result = db.table("posts").insert(post_data).execute()
    post_id = result.data[0]["id"]

    # Mark source news item as processed
    db.table("raw_news").update({"processed": True}).eq(
        "id", source_item["id"]
    ).execute()

    logger.info(f"  Created post: {content['title_en'][:60]}... (status: {status})")
    return post_id


async def run_async():
    """Async entry point for the content generator agent."""
    run_id = log_agent_run("content_generator")
    items_analyzed = 0
    posts_created = 0

    try:
        # --- Stage 1: Initial Analysis (concurrent) ---
        items_analyzed = await run_initial_analysis()

        # --- Stage 2: Post Generation ---
        logger.info("\n--- Stage 2: Running Post Generation ---")
        analyzed_items = fetch_analyzed_news(limit=20)
        logger.info(
            f"Found {len(analyzed_items)} analyzed items ready for post generation."
        )

        if not analyzed_items:
            complete_agent_run(run_id, "success", items_analyzed, posts_created)
            return

        for item in analyzed_items:
            content = generate_post_content([item])
            if content:
                store_post(content, item)
                posts_created += 1

        complete_agent_run(run_id, "success", items_analyzed, posts_created)
        logger.info(
            f"Completed run. Analyzed: {items_analyzed}, Posts Created: {posts_created}"
        )

    except Exception as e:
        logger.error(f"Agent failed: {e}", exc_info=True)
        complete_agent_run(run_id, "error", items_analyzed, posts_created, str(e))
        raise


def run():
    """Sync wrapper — called by agents.run CLI."""
    asyncio.run(run_async())


if __name__ == "__main__":
    run()
