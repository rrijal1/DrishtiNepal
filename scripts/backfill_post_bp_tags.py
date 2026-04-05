#!/usr/bin/env python3
"""
Backfill bp-* manifesto tags on published posts.

For each published post that has no bp-* tags, asks AI to identify which
manifesto items (bp-001..bp-100) the post's title and content relate to,
then updates the post's tags array.

Run once (idempotent — skips posts that already have bp-* tags):
    python scripts/backfill_post_bp_tags.py

Options:
    --dry-run   Print proposed tag updates without writing to DB
    --limit N   Process at most N posts (default: all)
"""

import sys
import os
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import parse_ai_json, setup_logger

logger = setup_logger("backfill_bp_tags")


# ── Load manifesto items once ─────────────────────────────────────────────────


def load_manifesto_index() -> list[dict]:
    """Return all manifesto items as [{source_id, title_en, category}]."""
    result = (
        db.table("manifesto_items")
        .select("source_id, title_en, category, item_text_en")
        .like("source_id", "bp-%")
        .order("source_id")
        .execute()
    )
    return result.data or []


def build_index_text(items: list[dict]) -> str:
    """Compact single-line reference for each manifesto item."""
    lines = []
    for it in items:
        text = (it.get("title_en") or "")[:80]
        lines.append(f"{it['source_id']}: {text}")
    return "\n".join(lines)


# ── AI matching ───────────────────────────────────────────────────────────────

CHUNK_SIZE = 25  # items per AI call — keeps prompt under ~3KB


def find_bp_items(post: dict, manifesto_items: list[dict]) -> list[str]:
    """Return a list of bp-XXX IDs the post is relevant to (may be empty).
    Splits the manifesto index into chunks to keep prompts small and fast."""
    title = post.get("title_en") or ""
    excerpt = post.get("excerpt_en") or ""
    content_snippet = (post.get("content_en") or "")[:400]

    matched: set[str] = set()

    for chunk_start in range(0, len(manifesto_items), CHUNK_SIZE):
        chunk = manifesto_items[chunk_start : chunk_start + CHUNK_SIZE]
        index_text = build_index_text(chunk)

        prompt = f"""Nepal RSP manifesto commitments (ID: title):
{index_text}

News post title: {title}
Excerpt: {excerpt}
Content: {content_snippet}

Return a JSON array of ONLY the IDs from the list above that this post DIRECTLY reports on
(progress, failure, or government action implementing/contradicting the commitment).
Return [] if none clearly apply. Max 3 IDs. ONLY a JSON array, no markdown."""

        try:
            response = cheap_completion(
                prompt,
                system="You are a Nepal governance analyst. Tag news articles with relevant manifesto commitment IDs.",
                max_tokens=128,
            )
            parsed = parse_ai_json(response, [])
            if isinstance(parsed, list):
                matched.update(
                    x for x in parsed if isinstance(x, str) and x.startswith("bp-")
                )
        except Exception as e:
            logger.warning(f"AI chunk failed for post {post.get('id', '?')}: {e}")
            continue

    return list(matched)


# ── Main ──────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(
        description="Backfill bp-* tags on published posts"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Print changes without writing"
    )
    parser.add_argument(
        "--limit", type=int, default=0, help="Max posts to process (0 = all)"
    )
    args = parser.parse_args()

    logger.info("Loading manifesto index…")
    manifesto_items = load_manifesto_index()
    if not manifesto_items:
        logger.error("No manifesto items found in DB. Run seed scripts first.")
        sys.exit(1)
    logger.info(f"  Loaded {len(manifesto_items)} manifesto items")

    logger.info("Fetching published posts…")
    query = (
        db.table("posts")
        .select("id, title_en, excerpt_en, content_en, tags")
        .eq("status", "published")
        .order("published_at", desc=True)
    )
    if args.limit:
        query = query.limit(args.limit)
    result = query.execute()
    all_posts = result.data or []
    logger.info(f"  Found {len(all_posts)} published posts")

    # Skip posts that already have bp-* tags
    to_process = [
        p
        for p in all_posts
        if not any(str(t).startswith("bp-") for t in (p.get("tags") or []))
    ]
    logger.info(
        f"  {len(to_process)} posts need bp-tag backfill (others already tagged)"
    )

    updated = 0
    skipped_empty = 0

    for i, post in enumerate(to_process, 1):
        post_id = post["id"]
        title = (post.get("title_en") or "")[:80]
        logger.info(f"[{i}/{len(to_process)}] {title}")

        bp_items = find_bp_items(post, manifesto_items)

        if not bp_items:
            logger.info(f"  → No manifesto items matched, skipping")
            skipped_empty += 1
            continue

        logger.info(f"  → Matched: {bp_items}")

        existing_tags = list(post.get("tags") or [])
        new_tags = list(set(existing_tags) | set(bp_items))

        if args.dry_run:
            logger.info(f"  [DRY RUN] Would update tags: {existing_tags} → {new_tags}")
        else:
            try:
                db.table("posts").update({"tags": new_tags}).eq("id", post_id).execute()
                updated += 1
            except Exception as e:
                logger.warning(f"  Failed to update post {post_id}: {e}")

    logger.info(
        f"\nDone. {updated} posts updated, {skipped_empty} had no matching manifesto items."
    )
    if args.dry_run:
        logger.info("(dry-run — no DB writes performed)")


if __name__ == "__main__":
    main()
