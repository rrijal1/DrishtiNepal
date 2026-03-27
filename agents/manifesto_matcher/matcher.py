"""
Drishti Nepal - Manifesto Matcher Agent
Links government actions to bachha patra / pratigya patra commitments.
"""

import json
from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("manifesto_matcher")


def get_unmatched_actions(limit: int = 30) -> list[dict]:
    """Get recent actions that haven't been matched to manifesto items."""
    # Actions not yet in action_manifesto_links
    result = (
        db.table("actions")
        .select("id, title_en, description_en, category, minister_id")
        .eq("published", True)
        .order("action_date", desc=True)
        .limit(limit)
        .execute()
    )
    # Filter out those already linked
    action_ids = [a["id"] for a in result.data]
    if not action_ids:
        return []

    existing_links = (
        db.table("action_manifesto_links")
        .select("action_id")
        .in_("action_id", action_ids)
        .execute()
    )
    linked_ids = {l["action_id"] for l in existing_links.data}
    return [a for a in result.data if a["id"] not in linked_ids]


def get_manifesto_items() -> list[dict]:
    """Get all manifesto items for matching."""
    result = (
        db.table("manifesto_items")
        .select("id, item_text_en, category, document_type")
        .execute()
    )
    return result.data


def match_action_to_manifesto(action: dict, manifesto_items: list[dict]) -> list[dict]:
    """Use AI to find matching manifesto items for an action."""
    manifesto_text = "\n".join(
        [
            f"[{i+1}] ({item['document_type']}/{item['category']}) {item['item_text_en']}"
            for i, item in enumerate(manifesto_items)
        ]
    )

    prompt = f"""You are matching a government action to political manifesto commitments.

ACTION:
Title: {action['title_en']}
Description: {action.get('description_en', 'N/A')}
Category: {action['category']}

MANIFESTO ITEMS (numbered):
{manifesto_text}

Which manifesto items does this action relate to? For each match, indicate:
- The item number
- Whether the action "supports", "contradicts", or "partially_fulfills" the commitment
- Your confidence (0.0 to 1.0)

Return a JSON array of matches. If no match, return an empty array [].
Example: [{{"item_number": 3, "link_type": "supports", "confidence": 0.85}}]

Return ONLY valid JSON."""

    try:
        response = cheap_completion(prompt, max_tokens=512)
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        matches = json.loads(response)
        return matches if isinstance(matches, list) else []
    except Exception as e:
        logger.error(f"AI matching failed for action {action['id']}: {e}")
        return []


def store_match(
    action_id: str, manifesto_item_id: str, link_type: str, confidence: float
):
    """Store an action-manifesto link."""
    db.table("action_manifesto_links").insert(
        {
            "action_id": action_id,
            "manifesto_item_id": manifesto_item_id,
            "link_type": link_type,
            "ai_confidence": min(1.0, max(0.0, confidence)),
            "human_verified": False,
        }
    ).execute()


def run():
    """Main entry point for the manifesto matcher agent."""
    run_id = log_agent_run("manifesto_matcher")
    items_processed = 0
    items_created = 0

    try:
        actions = get_unmatched_actions(limit=30)
        manifesto_items = get_manifesto_items()

        if not actions or not manifesto_items:
            logger.info("No unmatched actions or no manifesto items found")
            complete_agent_run(run_id, "success", 0, 0)
            return

        logger.info(
            f"Matching {len(actions)} actions against {len(manifesto_items)} manifesto items"
        )

        for action in actions:
            items_processed += 1
            matches = match_action_to_manifesto(action, manifesto_items)

            for match in matches:
                idx = match.get("item_number", 0) - 1  # Convert to 0-indexed
                if 0 <= idx < len(manifesto_items):
                    store_match(
                        action["id"],
                        manifesto_items[idx]["id"],
                        match.get("link_type", "supports"),
                        match.get("confidence", 0.5),
                    )
                    items_created += 1

            if matches:
                logger.info(
                    f"  Matched action '{action['title_en'][:50]}...' to {len(matches)} manifesto items"
                )

        complete_agent_run(run_id, "success", items_processed, items_created)

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_created, str(e))
        raise


if __name__ == "__main__":
    run()
