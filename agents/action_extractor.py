from datetime import datetime, timedelta, timezone

from agents.common.ai import get_embedding
from agents.common.db import db
from agents.common.utils import (
    setup_logger,
    log_agent_run,
    complete_agent_run,
    get_minister_map,
)

logger = setup_logger("action_extractor")


def run():
    """Extract actions from processed raw_news and store them in the actions table."""
    run_id = log_agent_run("action_extractor")
    actions_created = 0

    try:
        minister_map = get_minister_map()

        # Get processed news items that are cabinet-related
        # Only fetch items from the last 7 days to avoid growing scan
        cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

        news_items = (
            db.table("raw_news")
            .select("*")
            .not_.is_("processing_result", "null")
            .gte("scraped_at", cutoff)
            .execute()
        ).data

        # Batch-fetch existing action raw_news_ids — scoped to recent cutoff
        existing_actions = (
            db.table("actions").select("metadata").gte("action_date", cutoff).execute()
        ).data
        existing_raw_news_ids = set()
        for a in existing_actions:
            meta = a.get("metadata") or {}
            if "raw_news_id" in meta:
                existing_raw_news_ids.add(meta["raw_news_id"])

        for item in news_items:
            res = item["processing_result"]
            if not res.get("is_cabinet_related"):
                continue

            mentions = res.get("ministers_mentioned", [])
            if not mentions:
                # If it's cabinet related but no specific minister is mentioned,
                # we might want to attribute it to the PM or skip.
                # For now, let's skip unless there's a specific mention.
                continue

            for name in mentions:
                minister_id = minister_map.get(name)
                if not minister_id:
                    continue

                # Skip if action already exists for this raw_news item
                if item["id"] in existing_raw_news_ids:
                    continue

                # Create action
                action_data = {
                    "minister_id": minister_id,
                    "action_date": item.get("published_at")
                    or datetime.now(timezone.utc).date().isoformat(),
                    "title_en": item["title"],  # Use original title or AI summary?
                    "title_np": res.get("summary_np", "")[
                        :200
                    ],  # Truncate summary for title
                    "description_en": res.get("summary_en", ""),
                    "description_np": res.get("summary_np", ""),
                    "category": res.get("category", "other"),
                    "sentiment": res.get("sentiment", "neutral"),
                    "sources": [
                        {"url": item["source_url"], "name": item["source_name"]}
                    ],
                    "published": True,
                    "metadata": {"raw_news_id": item["id"]},
                }

                # Generate embedding
                try:
                    emb_text = (
                        f"{action_data['title_en']}: {action_data['description_en']}"
                    )
                    action_data["embedding"] = get_embedding(emb_text)
                except Exception as e:
                    logger.error(f"  Failed to generate embedding for action: {e}")

                db.table("actions").insert(action_data).execute()
                actions_created += 1
                logger.info(f"  Created action for {name}: {item['title'][:50]}...")

        complete_agent_run(run_id, "success", len(news_items), actions_created)
        logger.info(f"Action extraction complete. {actions_created} actions created.")

    except Exception as e:
        logger.error(f"Action extractor failed: {e}")
        complete_agent_run(run_id, "error", 0, actions_created, str(e))
        raise


if __name__ == "__main__":
    run()
