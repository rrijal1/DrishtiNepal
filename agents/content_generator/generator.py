"""
Drishti Nepal - Content Generator Agent
A two-stage agent that first performs a preliminary AI analysis on raw news,
then transforms the analyzed news into publishable posts.
"""

import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("content_generator")

# This function is moved from the scraper agent
def extract_with_ai(title: str, body: str) -> Optional[Dict]:
    """Use AI to extract structured data from a news article."""
    prompt = f"""Extract structured information from this Nepali news article.

Title: {title}

Body (excerpt): {(body or "")[:2000]}

Return a JSON object with:
- "ministers_mentioned": list of minister names mentioned (empty list if none)
- "category": one of "decision", "statement", "policy", "legislation", "scandal", "achievement", "appointment", "other"
- "sentiment": one of "positive", "negative", "neutral", "mixed"
- "summary_en": 2-3 sentence English summary
- "summary_np": 2-3 sentence Nepali summary
- "is_cabinet_related": boolean - true if directly related to cabinet minister activities

Return ONLY valid JSON, no other text."""

    try:
        response = cheap_completion(prompt, max_tokens=768)
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        return json.loads(response)
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"AI extraction failed for title '{title[:50]}...': {e}")
        return None

def run_initial_analysis(limit: int = 50) -> int:
    """
    Stage 1: Fetch newly scraped articles and enrich them with an initial AI analysis.
    """
    logger.info("--- Stage 1: Running Initial AI Analysis ---")
    newly_scraped_items = (
        db.table("raw_news")
        .select("id, title, body")
        .is_("processing_result", "null")
        .eq("processed", False)
        .limit(limit)
        .execute()
    ).data

    if not newly_scraped_items:
        logger.info("No new items to analyze.")
        return 0

    logger.info(f"Found {len(newly_scraped_items)} new items to analyze.")
    items_analyzed = 0
    for item in newly_scraped_items:
        ai_result = extract_with_ai(item['title'], item.get('body'))
        if ai_result:
            try:
                db.table("raw_news").update({"processing_result": ai_result}).eq("id", item["id"]).execute()
                items_analyzed += 1
                logger.info(f"  Successfully analyzed and updated: {item['title'][:70]}...")
            except Exception as e:
                logger.error(f"  DB update failed for item {item['id']}: {e}")
    
    logger.info(f"Completed analysis. {items_analyzed} items updated.")
    return items_analyzed


def fetch_analyzed_news(limit: int = 20) -> List[Dict]:
    """Get analyzed news items that haven't been turned into posts yet."""
    result = (
        db.table("raw_news")
        .select("*")
        .eq("processed", False)
        .is_("duplicate_of", "null")
        .not_.is_("processing_result", "null")
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

    prompt = f"""Based on the following news coverage, create a factual, balanced post for Drishti Nepal — a political accountability portal.

NEWS ITEMS:
{context}

Generate a JSON response with:
- "title_en": Concise English headline
- "title_np": Same headline in Nepali
- "body_en": 200-400 word factual article in English (Markdown format)
- "body_np": Same article in Nepali (Devanagari script, but technical/English-origin words like budget, GDP, infrastructure, policy can remain in English)
- "excerpt_en": 1-2 sentence English summary
- "excerpt_np": Same summary in natural Nepali
- "tags": list of relevant tags (e.g., ["economy", "cabinet-decision", "minister-name"])
- "type": one of "news_update", "analysis", "cabinet_decision"
- "auto_publishable": boolean - true only if purely factual with high confidence

LANGUAGE RULES for Nepali content:
- Write primarily in Nepali (Devanagari script)
- Technical terms, proper nouns, well-known English words can stay in English
- Core political vocabulary should be in Nepali: मन्त्री, सरकार, प्रतिबद्धता

Other rules:
- Be strictly factual and neutral. Do not editorialize.
- Attribute claims to sources.

Return ONLY valid JSON."""

    try:
        response = cheap_completion(prompt, max_tokens=2048)
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        return json.loads(response)
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
        "tags": content.get("tags", []),
        "author_type": "agent",
        "author_name": "Drishti Nepal AI",
        "status": status,
        "published_at": (
            datetime.now(timezone.utc).isoformat() if auto_publish else None
        ),
        # Pass through source info
        "source_url": source_item.get("source_url"),
        "source_name": source_item.get("source_name"),
    }

    result = db.table("posts").insert(post_data).execute()
    post_id = result.data[0]["id"]

    # Mark source news item as processed
    db.table("raw_news").update({"processed": True}).eq("id", source_item["id"]).execute()

    logger.info(f"  Created post: {content['title_en'][:60]}... (status: {status})")
    return post_id


def run():
    """Main entry point for the content generator agent."""
    run_id = log_agent_run("content_generator")
    items_analyzed = 0
    posts_created = 0

    try:
        # --- Stage 1: Initial Analysis ---
        items_analyzed = run_initial_analysis()

        # --- Stage 2: Post Generation ---
        logger.info("\n--- Stage 2: Running Post Generation ---")
        analyzed_items = fetch_analyzed_news(limit=20)
        logger.info(f"Found {len(analyzed_items)} analyzed items ready for post generation.")

        if not analyzed_items:
            complete_agent_run(run_id, "success", items_analyzed, posts_created)
            return

        # Simple 1-to-1 processing for now. Future: group related items.
        for item in analyzed_items:
            content = generate_post_content([item])
            if content:
                store_post(content, item) # Pass the whole item
                posts_created += 1

        complete_agent_run(run_id, "success", items_analyzed, posts_created)
        logger.info(
            f"Completed run. Analyzed: {items_analyzed}, Posts Created: {posts_created}"
        )

    except Exception as e:
        logger.error(f"Agent failed: {e}", exc_info=True)
        complete_agent_run(run_id, "error", items_analyzed, posts_created, str(e))
        raise


if __name__ == "__main__":
    run()
