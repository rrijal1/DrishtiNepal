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


def _get_minister_name_map() -> dict[str, str]:
    """Return {name_en_lower: uuid} for all active ministers."""
    result = (
        db.table("ministers")
        .select("id, name_en")
        .eq("status", "active")
        .execute()
    )
    return {m["name_en"].lower(): m["id"] for m in (result.data or [])}


def _get_manifesto_brief() -> str:
    """Return a compact bp-XXX → title map for the AI prompt context."""
    result = (
        db.table("manifesto_items")
        .select("source_id, title_en")
        .like("source_id", "bp-%")
        .order("source_id")
        .execute()
    )
    lines = [
        f"{r['source_id']}: {r['title_en']}"
        for r in (result.data or [])
    ]
    return "\n".join(lines)

logger = setup_logger("content_generator")

# Concurrency limit for AI calls (respect rate limits on free-tier NVIDIA NIM)
AI_CONCURRENCY = 5
# Max items to analyze per run — keeps each run under 10 minutes
ANALYSIS_BATCH_LIMIT = 25
# How far back to look for unprocessed news (rolling window, not beginning of time)
LOOKBACK_DAYS = 3
# Max news_update posts to create per run (3 runs/day = up to 15 news_updates/day)
NEWS_UPDATE_LIMIT_PER_RUN = 5
# Max analysis posts that can be in draft/published state on any given day
ANALYSIS_DAILY_DRAFT_LIMIT = 2


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


# Module-level cache so we don't re-query manifesto on every post
_MANIFESTO_BRIEF_CACHE: str | None = None


def generate_post_content(news_items: List[Dict]) -> Optional[Dict]:
    """
    Two-step content generation:
    1. Generate English content from source text, staying strictly factual
    2. Translate verified English content into Nepali

    This avoids factual errors that occur when both languages are generated
    simultaneously from truncated source text.
    """
    global _MANIFESTO_BRIEF_CACHE
    if not news_items:
        return None

    # Lazily load manifesto reference once per process run
    if _MANIFESTO_BRIEF_CACHE is None:
        _MANIFESTO_BRIEF_CACHE = _get_manifesto_brief()

    # Step 1: Generate English content — pass FULL source text for factual accuracy
    context = "\n\n".join(
        [
            f"Source: {item['source_name']}\nURL: {item.get('source_url', 'N/A')}\nTitle: {item['title']}\nBody:\n{(item.get('body') or '')[:3000]}\nAI Analysis: {json.dumps(item.get('processing_result') or {})}"
            for item in news_items
        ]
    )

    step1_prompt = f"""You are writing for Drishti Nepal (दृष्टि नेपाल) — a citizen-led political accountability portal.

NEWS ITEMS:
{context}

CRITICAL ACCURACY RULES:
- Use ONLY facts, names, numbers, dates, and quotes that appear in the source text above.
- Do NOT infer, assume, or fabricate any details not explicitly stated.
- If the source says "RSP has 182 seats", write exactly that. Do not change numbers.
- Use the exact names from the source text. If the source says "Dol Prasad Aryal", do not write "Devraj Ghimire".
- If you're uncertain about a fact, omit it rather than guess.

BACHHA PATRA MANIFESTO ITEMS (bp-001 to bp-100):
{_MANIFESTO_BRIEF_CACHE}

Generate a JSON response with:
- "title_en": Sharp, specific English headline. Use active voice. Name the minister/actor when relevant.
- "body_en": 200-400 word article (Markdown). Lead with the most important fact, then context, then accountability angle. Reference manifesto promises if relevant.
- "excerpt_en": 1-2 sentence hook. Make people want to click.
- "social_hook": Punchy line under 100 chars for social media.
- "tags": list of relevant tags (e.g., ["economy", "cabinet-decision"])
- "bp_items": list of Bachha Patra IDs this news DIRECTLY relates to, chosen from the manifesto list above. Be specific — only include IDs where there is a clear connection. Empty list [] if none apply.
- "type": one of "news_update", "analysis", "cabinet_decision"

WRITING RULES:
- Be factual, sourced, engaging. Attribute claims.
- Contrast promises vs reality when relevant.
- Never editorialize. Let facts speak.
- BANNED: em dashes, "Furthermore", "Moreover", "It's worth noting", "Notably", "comprehensive", "robust", "pivotal", "crucial", "underscores", "landscape", "navigating", "multifaceted", "nuanced", "fostering", "It remains to be seen", "Only time will tell", "In a move that".
- Use contractions naturally. Short paragraphs.

Return ONLY valid JSON."""

    try:
        response_en = cheap_completion(step1_prompt, max_tokens=1536)
        content_en = parse_ai_json(response_en)
        if (
            not content_en
            or "title_en" not in content_en
            or "body_en" not in content_en
        ):
            logger.error("Step 1 (English) produced invalid content")
            return None
    except Exception as e:
        logger.error(f"Step 1 (English) generation failed: {e}")
        return None

    # Step 2: Translate the verified English content into Nepali
    step2_prompt = f"""Translate the following English content into natural Nepali (Devanagari script).

RULES:
- This is journalism, not a textbook. Write how Nepali journalists write on online news portals.
- Technical/English-origin words stay in English: budget, GDP, infrastructure, policy, parliament, speaker, deputy speaker.
- Core political vocabulary in Nepali: मन्त्री, सरकार, प्रतिबद्धता, वचनपत्र, सभामुख, उपसभामुख, सांसद.
- Keep all facts, names, numbers, and dates exactly as in the English version. Do NOT change any factual content.
- Proper nouns (person names, party names) should use their commonly known Nepali transliterations.

ENGLISH TITLE: {content_en['title_en']}

ENGLISH ARTICLE:
{content_en['body_en']}

ENGLISH EXCERPT: {content_en.get('excerpt_en', '')}

Return a JSON with:
- "title_np": Nepali headline
- "body_np": Nepali article
- "excerpt_np": Nepali excerpt hook

Return ONLY valid JSON."""

    try:
        response_np = cheap_completion(step2_prompt, max_tokens=1536)
        content_np = parse_ai_json(response_np)
        if content_np:
            content_en["title_np"] = content_np.get("title_np", "")
            content_en["body_np"] = content_np.get("body_np", "")
            content_en["excerpt_np"] = content_np.get("excerpt_np", "")
        else:
            logger.warning("Step 2 (Nepali) returned empty; English-only post")
            content_en["title_np"] = ""
            content_en["body_np"] = ""
            content_en["excerpt_np"] = ""
    except Exception as e:
        logger.warning(f"Step 2 (Nepali translation) failed: {e}; English-only post")
        content_en["title_np"] = ""
        content_en["body_np"] = ""
        content_en["excerpt_np"] = ""

    return content_en


def create_slug(title: str) -> str:
    """Generate URL slug from title."""
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"[\s]+", "-", slug)
    slug = slug[:80].rstrip("-")
    date_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"{date_prefix}-{slug}"


def store_post(content: Dict, source_item: Dict):
    """Create a post entry in the database.

    Status logic:
    - 'analysis' type: ALWAYS 'draft' — requires human review before publishing
    - 'news_update'/'cabinet_decision': 'review' (human checks before publish)
    """
    post_type = content.get("type", "news_update")

    # Analysis posts always require human review
    if post_type == "analysis":
        status = "draft"
    else:
        status = "review"

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
        "published_at": None,
        # Pass through source info
        "source_url": source_item.get("source_url"),
        "metadata": {
            "social_hook": content.get("social_hook", ""),
            "source_name": source_item.get("source_name"),
        },
    }

    result = db.table("posts").insert(post_data).execute()
    post_id = result.data[0]["id"]

    # Link post to mentioned ministers via post_ministers junction table
    processing = source_item.get("processing_result") or {}
    mentioned_names: list[str] = processing.get("ministers_mentioned") or []
    if mentioned_names:
        minister_map = _get_minister_name_map()
        links = []
        for name in mentioned_names:
            uuid = minister_map.get(name.lower())
            if uuid:
                links.append({"post_id": post_id, "minister_id": uuid})
        if links:
            try:
                db.table("post_ministers").upsert(
                    links, on_conflict="post_id,minister_id"
                ).execute()
                logger.info(
                    f"  Linked to {len(links)} minister(s): "
                    + ", ".join(mentioned_names)
                )
            except Exception as e:
                logger.warning(f"  post_ministers insert failed: {e}")

    # Mark source news item as processed
    db.table("raw_news").update({"processed": True}).eq(
        "id", source_item["id"]
    ).execute()

    logger.info(f"  Created post: {content['title_en'][:60]}... (status: {status})")
    return post_id


def _count_todays_posts(category: str) -> int:
    """Count how many posts of a given category were created today."""
    today_start = (
        datetime.now(timezone.utc)
        .replace(hour=0, minute=0, second=0, microsecond=0)
        .isoformat()
    )
    result = (
        db.table("posts")
        .select("id", count="exact")
        .eq("category", category)
        .gte("created_at", today_start)
        .execute()
    )
    return result.count or 0


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

        # Check daily limits
        analysis_today = _count_todays_posts("analysis")
        news_update_count = 0

        for item in analyzed_items:
            if news_update_count >= NEWS_UPDATE_LIMIT_PER_RUN:
                logger.info(
                    f"Hit news_update limit for this run ({NEWS_UPDATE_LIMIT_PER_RUN})"
                )
                break

            content = generate_post_content([item])
            if not content:
                continue

            post_type = content.get("type", "news_update")

            # Enforce daily analysis limit
            if post_type == "analysis":
                if analysis_today >= ANALYSIS_DAILY_DRAFT_LIMIT:
                    logger.info(
                        f"Skipping analysis — daily limit reached ({ANALYSIS_DAILY_DRAFT_LIMIT})"
                    )
                    continue
                analysis_today += 1

            store_post(content, item)
            posts_created += 1
            if post_type == "news_update":
                news_update_count += 1

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
