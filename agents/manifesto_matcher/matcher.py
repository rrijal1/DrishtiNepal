"""
Drishti Nepal - Manifesto Matcher Agent
Links government actions to bachha patra / karar patra commitments.
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
    linked_ids = {link["action_id"] for link in existing_links.data}
    return [a for a in result.data if a["id"] not in linked_ids]


def get_manifesto_items() -> list[dict]:
    """Get all manifesto items for matching, including structured commitment data."""
    result = (
        db.table("manifesto_items")
        .select(
            "id, source_id, item_text_en, title_en, key_commitments, category, document_type"
        )
        .execute()
    )
    return result.data


def match_action_to_manifesto(action: dict, manifesto_items: list[dict]) -> list[dict]:
    """Use AI to find matching manifesto items for an action.

    वाचा पालन — electoral accountability: does this government action
    deliver on a specific vacha patra commitment? भनाइ (rhetoric) is
    one thing — गराइ (action) is another. We match actions to concrete
    commitments, not vague thematic similarity.
    """
    manifesto_lines = []
    for i, item in enumerate(manifesto_items):
        src = item.get("source_id") or "?"
        title = item.get("title_en") or item["item_text_en"]
        commitments = item.get("key_commitments") or []
        commitments_str = (
            "; ".join(commitments)
            if commitments
            else "(no specific commitments listed)"
        )
        manifesto_lines.append(
            f"[{i+1}] {src} ({item['document_type']}/{item['category']}) {title}\n"
            f"    Commitments: {commitments_str}"
        )
    manifesto_text = "\n".join(manifesto_lines)

    prompt = f"""You are an objective fact-checker matching a government action to specific manifesto promises.

CRITICAL: We measure DELIVERY against PROMISES — not thematic similarity.
- A speech or statement repeating a promise is NOT delivery.
- Only concrete actions (policy enacted, budget allocated, legislation passed, measurable outcome) count as "supports".
- If the action contradicts or reverses a commitment, mark it "contradicts".
- If it makes partial progress (e.g. committee formed, bill introduced but not passed), mark it "partially_fulfills".
- Only match when a clear, specific link exists between the action and a commitment.

ACTION:
Title: {action['title_en']}
Description: {action.get('description_en', 'N/A')}
Category: {action['category']}

MANIFESTO COMMITMENTS (numbered, each with source ID and specific commitments):
{manifesto_text}

Which manifesto items does this action CONCRETELY deliver on (or contradict)? For each match:
- item_number (the bracketed number)
- link_type: "supports" (concrete delivery), "contradicts" (reversal), or "partially_fulfills" (partial progress)
- confidence (0.0 to 1.0)

Return a JSON array. If no concrete match, return [].
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
