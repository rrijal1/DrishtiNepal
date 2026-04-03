"""
Drishti Nepal - Manual Link Ingester Agent
------------------------------------------
Reads data/manual_links.md, fetches any URL that hasn't been processed yet,
runs a combined AI analysis + manifesto matching pass, creates a published post,
and wires up action_manifesto_links so the manifesto item detail pages show the article.

Run:
    python -m agents.run manual          # via the standard runner
    python -m agents.manual_ingester.ingester   # directly
"""

import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import (
    setup_logger,
    log_agent_run,
    complete_agent_run,
    parse_ai_json,
)

logger = setup_logger("manual_ingester")

# Path to the manual links file — relative to repo root
LINKS_FILE = Path(__file__).parent.parent.parent / "data" / "manual_links.md"

# Re-use the manifesto context we already have in the DB (no hardcoding needed)
HTTP_TIMEOUT = 20
MAX_BODY_CHARS = 4000


# ── helpers ──────────────────────────────────────────────────────────────────


def load_pending_urls() -> list[dict]:
    """
    Parse data/manual_links.md and return only URLs not yet ingested.
    Each entry: {"url": ..., "hint": ...}
    Already-ingested URLs are tracked via raw_news.source_url + manual_link=True metadata.
    """
    if not LINKS_FILE.exists():
        logger.warning(f"Manual links file not found: {LINKS_FILE}")
        return []

    text = LINKS_FILE.read_text(encoding="utf-8")

    # Find everything under the ## Links section
    links_section = re.search(r"^## Links\s*\n(.*)", text, re.MULTILINE | re.DOTALL)
    if not links_section:
        logger.info("No '## Links' section found in manual_links.md")
        return []

    raw_lines = links_section.group(1).splitlines()
    parsed = []
    for line in raw_lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "|" in line:
            url, hint = line.split("|", 1)
            parsed.append({"url": url.strip(), "hint": hint.strip()})
        else:
            parsed.append({"url": line.strip(), "hint": ""})

    if not parsed:
        return []

    # Check which URLs have already been ingested (stored in raw_news with manual flag)
    urls = [e["url"] for e in parsed]
    existing = (
        db.table("raw_news").select("source_url").in_("source_url", urls).execute()
    ).data
    already_done = {r["source_url"] for r in existing}

    pending = [e for e in parsed if e["url"] not in already_done]
    logger.info(
        f"Manual links: {len(parsed)} total, {len(already_done)} already ingested, {len(pending)} pending."
    )
    return pending


def scrape_url(url: str) -> Optional[dict]:
    """Fetch a URL and return {title, body, source_name}."""
    try:
        resp = httpx.get(
            url,
            headers={"User-Agent": "DrishtiNepal/1.0 (https://drishtinepal.com)"},
            timeout=HTTP_TIMEOUT,
            follow_redirects=True,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title = ""
    tag = soup.find("meta", property="og:title") or soup.find("title")
    if tag:
        title = tag.get("content", "") or tag.get_text(strip=True)

    # Body — try article tag first, fall back to paragraphs
    article_el = soup.find("article") or soup.find(
        "div", class_=re.compile(r"content|body|article", re.I)
    )
    if article_el:
        body = article_el.get_text(separator="\n", strip=True)
    else:
        body = "\n".join(p.get_text(strip=True) for p in soup.find_all("p"))

    # Source name from domain
    from urllib.parse import urlparse

    domain = urlparse(url).netloc.replace("www.", "")

    return {
        "title": title[:300],
        "body": body[:MAX_BODY_CHARS],
        "source_name": domain,
        "source_url": url,
    }


def analyse_and_match(scraped: dict, hint: str) -> Optional[dict]:
    """
    Single AI call: analyse the article, identify ministers, write a post,
    AND identify which bp- manifesto items it relates to.
    Returns structured JSON or None on failure.
    """
    # Fetch manifesto item summaries for the AI to reference
    manifesto_context = _build_manifesto_context()

    prompt = f"""You are a senior journalist at Drishti Nepal (दृष्टि नेपाल), a citizen-led accountability portal tracking Nepal's RSP-led government against its own manifesto promises.

ARTICLE SOURCE: {scraped['source_name']}
URL: {scraped['source_url']}
{f'EDITOR HINT: {hint}' if hint else ''}

ARTICLE TITLE: {scraped['title']}

ARTICLE BODY (may be in Nepali or English — analyse either language):
{scraped['body']}

---

RSP MANIFESTO ITEMS (source_id → title):
{manifesto_context}

---

TASK: Analyse this article and return a single JSON object. ALL of the following keys are REQUIRED — never omit any:

{{
  "title_en": "Sharp English headline (translate from Nepali if needed). Active voice, name the actor.",
  "title_np": "Same headline in natural Devanagari Nepali",
  "body_en": "200-400 word Markdown article in English",
  "body_np": "Same article in natural Nepali",
  "excerpt_en": "1-2 sentence tweet-style hook in English",
  "excerpt_np": "Same hook in Nepali",
  "social_hook": "Under 100 chars for social",
  "tags": ["tag1"],
  "type": "news_update|analysis|cabinet_decision",
  "auto_publishable": true,
  "bp_items": ["bp-001"],
  "link_type": "supports|contradicts|partially_fulfills",
  "ministers_mentioned": [],
  "is_significant": true
}}

NOTES:
- Article may be Nepali or English — always produce BOTH language fields regardless.
- bp_items: only IDs you are confident about. Empty array [] is fine.
- link_type can also be a dict keyed by source_id if different items have different relationships.
- is_significant = true ONLY for concrete actions (arrest, policy enacted, law passed, budget allocated) — not statements or promises.

WRITING RULES:
- Factual, un-partisan, no opinions — hold all politicians to their own words
- NEVER use em dashes (—). Use commas or separate sentences.
- BANNED phrases: "Furthermore", "Moreover", "It's worth noting", "comprehensive", "robust", "pivotal", "crucial", "underscores", "nuanced"
- Use contractions naturally. Short paragraphs. Sentence fragments are fine.
- Nepali text: sound like Nepali Twitter, not a textbook

Return ONLY valid JSON, nothing else."""

    try:
        response = cheap_completion(prompt, max_tokens=2048)
        return parse_ai_json(response)
    except Exception as e:
        logger.error(f"AI analysis failed for {scraped['source_url']}: {e}")
        return None


def _normalize_analysis(analysis: dict, scraped: dict) -> Optional[dict]:
    """
    Validate and fill in missing keys from the AI response.
    Returns None if the result is too broken to use.
    """
    if not analysis:
        return None

    # Try alternative key names the AI sometimes uses
    for alt in ("title", "headline", "title_english"):
        if "title_en" not in analysis and alt in analysis:
            analysis["title_en"] = analysis[alt]
    for alt in ("body", "content", "body_english", "article_en"):
        if "body_en" not in analysis and alt in analysis:
            analysis["body_en"] = analysis[alt]

    # Last resort fallbacks from scraped data
    if not analysis.get("title_en"):
        analysis["title_en"] = scraped.get("title", "Untitled")
        logger.warning("AI did not return title_en — using scraped page title as fallback")
    if not analysis.get("body_en"):
        logger.error("AI returned no body_en — skipping this item")
        return None

    # Fill optional fields with safe defaults
    analysis.setdefault("title_np", "")
    analysis.setdefault("body_np", "")
    analysis.setdefault("excerpt_en", analysis["title_en"])
    analysis.setdefault("excerpt_np", "")
    analysis.setdefault("social_hook", "")
    analysis.setdefault("tags", [])
    analysis.setdefault("type", "news_update")
    analysis.setdefault("auto_publishable", False)
    analysis.setdefault("bp_items", [])
    analysis.setdefault("link_type", "supports")
    analysis.setdefault("ministers_mentioned", [])
    analysis.setdefault("is_significant", False)

    # Validate type enum
    valid_types = {"news_update", "analysis", "cabinet_decision"}
    if analysis["type"] not in valid_types:
        analysis["type"] = "news_update"

    return analysis


def _build_manifesto_context() -> str:
    """Fetch all bp- manifesto items and return a compact context string."""
    try:
        items = (
            db.table("manifesto_items")
            .select("source_id, title_en")
            .like("source_id", "bp-%")
            .order("source_id")
            .execute()
        ).data
        return "\n".join(f"{i['source_id']}: {i['title_en']}" for i in items)
    except Exception as e:
        logger.warning(f"Could not load manifesto context: {e}")
        return "(manifesto items unavailable)"


def store_ingested(scraped: dict, analysis: dict) -> Optional[str]:
    """
    Create: raw_news row (marked processed), posts row (published),
    and action_manifesto_links rows for each matched bp item.
    Returns post_id or None.
    """
    auto_publish = analysis.get("auto_publishable", True)
    status = "published" if auto_publish else "review"
    now = datetime.now(timezone.utc).isoformat()

    # Merge bp_items into tags
    tags = list(set(analysis.get("tags", [])) | set(analysis.get("bp_items", [])))

    # 1. Insert into raw_news so it's tracked and won't be re-ingested
    raw_news_row = {
        "title": scraped["title"],
        "body": scraped["body"],
        "source_name": scraped["source_name"],
        "source_url": scraped["source_url"],
        "scraped_at": now,
        "processed": True,
        "metadata": {"manual_link": True, "hint": scraped.get("hint", "")},
    }
    try:
        db.table("raw_news").insert(raw_news_row).execute()
    except Exception as e:
        logger.warning(f"raw_news insert failed (may already exist): {e}")

    # 2. Create the post
    slug = _make_slug(analysis["title_en"])
    post_data = {
        "category": analysis.get("type", "news_update"),
        "slug": slug,
        "title_en": analysis["title_en"],
        "title_np": analysis.get("title_np", ""),
        "content_en": analysis["body_en"],
        "content_np": analysis.get("body_np", ""),
        "excerpt_en": analysis.get("excerpt_en", ""),
        "excerpt_np": analysis.get("excerpt_np", ""),
        "ai_generated": True,
        "tags": tags,
        "author_type": "agent",
        "author_name": "Drishti Nepal AI",
        "status": status,
        "published_at": now if status == "published" else None,
        "source_url": scraped["source_url"],
        "metadata": {
            "social_hook": analysis.get("social_hook", ""),
            "source_name": scraped["source_name"],
            "manual_link": True,
        },
    }

    try:
        result = db.table("posts").insert(post_data).execute()
        post_id = result.data[0]["id"]
        logger.info(
            f"  Created post: {analysis['title_en'][:70]}... (status: {status})"
        )
    except Exception as e:
        logger.error(f"  Post insert failed: {e}")
        return None

    # 3. Wire manifesto item links (cabinet_decision_manifesto_links or action_manifesto_links)
    # We create an action row first, then link it — or directly create cabinet_decision_manifesto_links
    # if the article is significant enough to be treated as a government action.
    bp_items = analysis.get("bp_items", [])
    link_type_raw = analysis.get("link_type", "supports")

    if bp_items and analysis.get("is_significant"):
        # Fetch manifesto item UUIDs
        item_rows = (
            db.table("manifesto_items")
            .select("id, source_id")
            .in_("source_id", bp_items)
            .execute()
        ).data

        for item_row in item_rows:
            sid = item_row["source_id"]
            mid = item_row["id"]
            # link_type can be a dict keyed by source_id or a single value
            if isinstance(link_type_raw, dict):
                lt = link_type_raw.get(sid, "supports")
            else:
                lt = (
                    link_type_raw
                    if link_type_raw
                    in ("supports", "contradicts", "partially_fulfills")
                    else "supports"
                )

            try:
                # Insert an action row to represent this event
                action_result = (
                    db.table("actions")
                    .insert(
                        {
                            "title_en": analysis["title_en"],
                            "description_en": analysis.get("excerpt_en", ""),
                            "action_date": now[:10],
                            "category": analysis.get("type", "news_update"),
                            "sentiment": (
                                "positive"
                                if lt == "supports"
                                else ("negative" if lt == "contradicts" else "neutral")
                            ),
                            "published": True,
                            "sources": [scraped["source_url"]],
                            "metadata": {"manual_link": True},
                        }
                    )
                    .execute()
                )
                action_id = action_result.data[0]["id"]

                db.table("action_manifesto_links").insert(
                    {
                        "action_id": action_id,
                        "manifesto_item_id": mid,
                        "link_type": lt,
                        "ai_confidence": 0.85,
                        "human_verified": False,
                        "metadata": {"source": "manual_ingester"},
                    }
                ).execute()

                logger.info(f"  Linked to manifesto item {sid} ({lt})")
            except Exception as e:
                logger.warning(f"  Failed to create manifesto link for {sid}: {e}")

    return post_id


def _make_slug(title: str) -> str:
    slug = title.lower().strip()
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = slug[:80].rstrip("-")
    date_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"{date_prefix}-{slug}"


# ── main entry point ──────────────────────────────────────────────────────────


def run():
    """Main entry point — called by `python -m agents.run manual`."""
    run_id = log_agent_run("manual_ingester")
    items_processed = 0
    posts_created = 0

    try:
        pending = load_pending_urls()
        if not pending:
            logger.info("No new manual links to process.")
            complete_agent_run(run_id, "success", 0, 0)
            return

        logger.info(f"Processing {len(pending)} new manual link(s)...")

        for entry in pending:
            url = entry["url"]
            hint = entry.get("hint", "")
            logger.info(f"  Processing: {url}")
            items_processed += 1

            scraped = scrape_url(url)
            if not scraped:
                continue
            scraped["hint"] = hint

            analysis = analyse_and_match(scraped, hint)
            if not analysis:
                continue
            analysis = _normalize_analysis(analysis, scraped)
            if not analysis:
                logger.warning(f"  Skipping {url}: AI response could not be normalized")
                continue

            post_id = store_ingested(scraped, analysis)
            if post_id:
                posts_created += 1

        complete_agent_run(run_id, "success", items_processed, posts_created)
        logger.info(
            f"Done. Processed {items_processed} links, created {posts_created} posts."
        )

    except Exception as e:
        logger.error(f"Agent failed: {e}", exc_info=True)
        complete_agent_run(run_id, "error", items_processed, posts_created, str(e))
        raise


if __name__ == "__main__":
    run()
