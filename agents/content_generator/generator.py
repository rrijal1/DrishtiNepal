"""
Drishti Nepal - Content Generator Agent
Transforms raw news into publishable posts with manifesto linking.
"""

import json
import re
from datetime import datetime, timezone

from agents.common.db import db
from agents.common.ai import cheap_completion, quality_completion
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("content_generator")


def fetch_unprocessed_news(limit: int = 20) -> list[dict]:
    """Get raw news items that haven't been turned into posts yet."""
    result = (
        db.table("raw_news")
        .select("*")
        .eq("processed", False)
        .is_("duplicate_of", "null")
        .order("scraped_at", desc=False)
        .limit(limit)
        .execute()
    )
    return result.data


def generate_post_content(news_items: list[dict]) -> dict | None:
    """Generate a publishable post from one or more news items."""
    if not news_items:
        return None

    # Combine context from related news items
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
- "body_np": Same article in Nepali (Devanagari script, but technical/English-origin words like budget, GDP, infrastructure, policy can remain in English — this mirrors how educated Nepalis actually write and read)
- "excerpt_en": 1-2 sentence English summary
- "excerpt_np": Same summary in natural Nepali (mixed script OK for technical terms)
- "tags": list of relevant tags (e.g., ["economy", "cabinet-decision", "minister-name"])
- "type": one of "news_update", "analysis", "cabinet_decision"
- "auto_publishable": boolean - true only if purely factual with high confidence

LANGUAGE RULES for Nepali content:
- Write primarily in Nepali (Devanagari script)
- Technical terms, proper nouns, well-known English words can stay in English
- This natural code-switching reflects how Nepalis actually discuss politics
- Do NOT force awkward Nepali translations of words like "infrastructure", "budget deficit", "GDP"
- Core political vocabulary should be in Nepali: मन्त्री, सरकार, प्रतिबद्धता, बाचा पत्र, प्रतिज्ञा पत्र

Other rules:
- Be strictly factual and neutral
- Attribute all claims to sources
- Do not editorialize
- Use professional journalistic tone
- Include relevant context about manifesto commitments if applicable

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


def store_post(content: dict, source_news_ids: list[str]):
    """Create a post entry in the database."""
    auto_publish = content.get("auto_publishable", False)
    status = "published" if auto_publish else "review"

    post_data = {
        "type": content.get("type", "news_update"),
        "slug": create_slug(content["title_en"]),
        "title_en": content["title_en"],
        "title_np": content.get("title_np", ""),
        "body_en": content["body_en"],
        "body_np": content.get("body_np", ""),
        "excerpt_en": content.get("excerpt_en", ""),
        "excerpt_np": content.get("excerpt_np", ""),
        "tags": content.get("tags", []),
        "author_type": "agent",
        "author_name": "Drishti Nepal AI",
        "status": status,
        "published_at": (
            datetime.now(timezone.utc).isoformat() if auto_publish else None
        ),
    }

    result = db.table("posts").insert(post_data).execute()
    post_id = result.data[0]["id"]

    # Mark source news items as processed
    for news_id in source_news_ids:
        db.table("raw_news").update({"processed": True}).eq("id", news_id).execute()

    logger.info(f"Created post: {content['title_en'][:60]}... (status: {status})")
    return post_id


def run():
    """Main entry point for the content generator agent."""
    run_id = log_agent_run("content_generator")
    items_processed = 0
    items_created = 0

    try:
        news_items = fetch_unprocessed_news(limit=20)
        logger.info(f"Found {len(news_items)} unprocessed news items")

        if not news_items:
            complete_agent_run(run_id, "success", 0, 0)
            return

        # Group by minister if possible, otherwise process individually
        for item in news_items:
            items_processed += 1
            content = generate_post_content([item])
            if content:
                store_post(content, [item["id"]])
                items_created += 1

        complete_agent_run(run_id, "success", items_processed, items_created)
        logger.info(
            f"Completed: {items_processed} processed, {items_created} posts created"
        )

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_created, str(e))
        raise


if __name__ == "__main__":
    run()
