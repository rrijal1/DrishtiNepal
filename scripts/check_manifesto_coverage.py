"""
Drishti Nepal - Manifesto Coverage Diagnostic
Prints a summary of which manifesto items have non-empty sections.

Usage:
    python scripts/check_manifesto_coverage.py
    python scripts/check_manifesto_coverage.py --empty-only   # only show items with ALL sections empty
    python scripts/check_manifesto_coverage.py --filled-only  # only show items with ANY data
"""

import sys
import os

# Allow running from repo root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.common.db import db

EMPTY_ONLY = "--empty-only" in sys.argv
FILLED_ONLY = "--filled-only" in sys.argv


def run():
    print("Fetching manifesto items...")
    items = (
        db.table("manifesto_items")
        .select("id, source_id, title_en, status")
        .like("source_id", "bp-%")
        .order("source_id")
        .execute()
    ).data

    if not items:
        print("No manifesto items found. Have you run `python -m agents.seed`?")
        return

    item_ids = [i["id"] for i in items]
    id_to_item = {i["id"]: i for i in items}

    print(f"Checking {len(items)} manifesto items for linked data...\n")

    # Fetch links in bulk (much faster than N+1 queries)
    action_links = (
        db.table("action_manifesto_links")
        .select("manifesto_item_id")
        .in_("manifesto_item_id", item_ids)
        .execute()
    ).data

    decision_links = (
        db.table("cabinet_decision_manifesto_links")
        .select("manifesto_item_id")
        .in_("manifesto_item_id", item_ids)
        .execute()
    ).data

    evidence_items = (
        db.table("initiative_evidence")
        .select("manifesto_item_id")
        .in_("manifesto_item_id", item_ids)
        .eq("status", "approved")
        .execute()
    ).data

    # Count by manifesto_item_id
    def count_by_id(rows):
        counts = {}
        for r in rows:
            mid = r["manifesto_item_id"]
            counts[mid] = counts.get(mid, 0) + 1
        return counts

    action_counts = count_by_id(action_links)
    decision_counts = count_by_id(decision_links)
    evidence_counts = count_by_id(evidence_items)

    # Fetch tag-matched posts (requires tags column to be searchable)
    # We query all published posts with a bp- tag and parse them
    post_bp_map = {}  # source_id -> count
    try:
        posts = (
            db.table("posts").select("tags").eq("status", "published").execute()
        ).data
        for post in posts:
            for tag in post.get("tags") or []:
                if tag.startswith("bp-"):
                    post_bp_map[tag] = post_bp_map.get(tag, 0) + 1
    except Exception as e:
        print(f"  (could not fetch posts: {e})")

    # Build report
    totally_empty = []
    partially_filled = []
    fully_filled = []

    for item in items:
        mid = item["id"]
        sid = item["source_id"]
        actions = action_counts.get(mid, 0)
        decisions = decision_counts.get(mid, 0)
        ev = evidence_counts.get(mid, 0)
        posts = post_bp_map.get(sid, 0)

        has_gov = actions > 0 or decisions > 0
        has_news = ev > 0 or posts > 0

        row = {
            "source_id": sid,
            "title": item["title_en"] or "",
            "status": item["status"],
            "actions": actions,
            "decisions": decisions,
            "evidence": ev,
            "posts": posts,
        }

        if not has_gov and not has_news:
            totally_empty.append(row)
        elif has_gov and has_news:
            fully_filled.append(row)
        else:
            partially_filled.append(row)

    def print_row(r):
        print(
            f"  {r['source_id']:8s}  [{r['status']:25s}]  "
            f"actions={r['actions']}  decisions={r['decisions']}  "
            f"evidence={r['evidence']}  posts={r['posts']}  "
            f"| {r['title'][:60]}"
        )

    if not EMPTY_ONLY:
        print(
            f"=== FULLY COVERED ({len(fully_filled)}) — both Gov Actions and News/Evidence ==="
        )
        for r in fully_filled:
            print_row(r)
        print()

        print(
            f"=== PARTIALLY COVERED ({len(partially_filled)}) — one section empty ==="
        )
        for r in partially_filled:
            print_row(r)
        print()

    if not FILLED_ONLY:
        print(
            f"=== TOTALLY EMPTY ({len(totally_empty)}) — no data in either section ==="
        )
        for r in totally_empty:
            print_row(r)
        print()

    print("─" * 80)
    print(
        f"Summary:  {len(fully_filled)} fully covered | {len(partially_filled)} partial | {len(totally_empty)} empty  (out of {len(items)} total)"
    )


if __name__ == "__main__":
    run()
