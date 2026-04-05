#!/usr/bin/env python3
"""
Backfill post_ministers junction table for published posts that were created
before the store_post() fix.

Strategy:
  1. Build a {slug -> minister_id} map by converting minister name_en to slug form.
     e.g. "Balendra Shah" -> "balendra-shah"
  2. For every published post, check each tag against the slug map.
  3. Insert matching rows into post_ministers (upsert to stay idempotent).

Run once:
    python scripts/backfill_post_ministers.py
"""
import re
import sys
import os

# Allow running from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.common.db import db


def slugify(name: str) -> str:
    """Convert "Balendra Shah" -> "balendra-shah"."""
    name = name.lower().strip()
    name = re.sub(r"[^\w\s-]", "", name)
    name = re.sub(r"[\s_]+", "-", name)
    return name


def build_name_to_uuid() -> dict[str, str]:
    """Return both slug and lowercase-name variants for each minister."""
    result = (
        db.table("ministers")
        .select("id, name_en")
        .execute()
    )
    mapping: dict[str, str] = {}
    for m in result.data or []:
        name = m["name_en"]
        uuid = m["id"]
        mapping[slugify(name)] = uuid          # e.g. "balendra-shah"
        mapping[name.lower()] = uuid           # e.g. "balendra shah"
    return mapping


def build_url_to_ministers() -> dict[str, list[str]]:
    """Return {source_url: [minister_uuid, ...]} from raw_news with ministers_mentioned."""
    result = (
        db.table("raw_news")
        .select("source_url, processing_result")
        .eq("processed", True)
        .execute()
    )
    url_map: dict[str, list[str]] = {}
    minister_name_map = build_name_to_uuid()
    for row in result.data or []:
        url = row.get("source_url")
        if not url:
            continue
        pr = row.get("processing_result") or {}
        names: list = pr.get("ministers_mentioned") or []
        uuids = []
        for name in names:
            uuid = minister_name_map.get(name.lower()) or minister_name_map.get(slugify(name))
            if uuid:
                uuids.append(uuid)
        if uuids:
            url_map[url] = uuids
    return url_map


def main() -> None:
    name_map = build_name_to_uuid()
    url_to_ministers = build_url_to_ministers()
    print(f"Loaded {len(name_map)} minister name variants")
    print(f"Loaded {len(url_to_ministers)} raw_news URL->minister mappings")

    posts_result = (
        db.table("posts")
        .select("id, tags, source_url")
        .eq("status", "published")
        .execute()
    )
    posts = posts_result.data or []
    print(f"Processing {len(posts)} published posts...")

    total_links = 0
    for post in posts:
        post_id = post["id"]
        tags: list = post.get("tags") or []
        seen_uuids: set[str] = set()
        links = []

        # Strategy 1: match tags via name/slug map (handles both "ravi-lamichhane"
        # and "Ravi Lamichhane" tag formats)
        for tag in tags:
            uuid = name_map.get(tag.lower()) or name_map.get(slugify(tag))
            if uuid and uuid not in seen_uuids:
                links.append({"post_id": post_id, "minister_id": uuid})
                seen_uuids.add(uuid)

        # Strategy 2: match via source_url → raw_news.ministers_mentioned
        src_url = post.get("source_url")
        if src_url and src_url in url_to_ministers:
            for uuid in url_to_ministers[src_url]:
                if uuid not in seen_uuids:
                    links.append({"post_id": post_id, "minister_id": uuid})
                    seen_uuids.add(uuid)

        if links:
            try:
                db.table("post_ministers").upsert(
                    links, on_conflict="post_id,minister_id"
                ).execute()
                print(f"  post {post_id[:8]}: linked {len(links)} minister(s) "
                      f"| tags={[t for t in tags if name_map.get(t.lower()) or name_map.get(slugify(t))]}")
                total_links += len(links)
            except Exception as e:
                print(f"  post {post_id[:8]}: ERROR - {e}")

    print(f"\nDone. Inserted/updated {total_links} post_ministers rows across {len(posts)} posts.")


if __name__ == "__main__":
    main()
