
"""
Drishti Nepal - Manifesto Matcher Agent
Links government actions to bachha patra / karar patra commitments using embeddings.
"""

import json
from typing import List, Dict

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("manifesto_matcher")

def get_unmatched_actions(limit: int = 30) -> List[Dict]:
    """Get recent actions that haven't been matched to manifesto items."""
    result = (
        db.table("actions")
        .select("id, title_en, description_en, category, minister_id, embedding")
        .eq("published", True)
        .not_.is_("embedding", "null")
        .order("action_date", desc=True)
        .limit(limit)
        .execute()
    )
    
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

def find_candidate_matches(action_embedding: List[float], threshold: float = 0.3, count: int = 5) -> List[Dict]:
    """Use vector similarity to find top candidate manifesto items."""
    try:
        # Call the RPC function we just created
        result = db.rpc("match_manifesto_items", {
            "query_embedding": action_embedding,
            "match_threshold": threshold,
            "match_count": count
        }).execute()
        return result.data
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return []

def verify_match_with_ai(action: Dict, candidate: Dict) -> Dict:
    """Use AI to verify if a candidate match is actually a delivery or contradiction."""
    
    commitments = candidate.get("key_commitments") or []
    commitments_str = "; ".join(commitments) if commitments else "(no specific commitments listed)"
    
    prompt = f"""You are an objective fact-checker matching a government action to a specific manifesto promise.

CRITICAL: We measure DELIVERY against PROMISES — not just thematic similarity.
- A speech repeating a promise is NOT delivery.
- Concrete actions (policy enacted, budget allocated, legislation passed, measurable outcome) count as "supports".
- If the action contradicts or reverses a commitment, mark it "contradicts".
- If it makes partial progress (e.g. committee formed, bill introduced), mark it "partially_fulfills".

ACTION:
Title: {action['title_en']}
Description: {action.get('description_en', 'N/A')}

MANIFESTO ITEM:
Source ID: {candidate['source_id']}
Title: {candidate['title_en']}
Text: {candidate['item_text_en']}
Specific Commitments: {commitments_str}

Does this action CONCRETELY deliver on (or contradict) this manifesto item?
Return a JSON object with:
- "match": boolean
- "link_type": "supports", "contradicts", "partially_fulfills", or null
- "confidence": 0.0 to 1.0
- "reason": 1-sentence explanation

Return ONLY valid JSON."""

    try:
        response = cheap_completion(prompt, max_tokens=256)
        response = response.strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        return json.loads(response)
    except Exception as e:
        logger.error(f"AI verification failed: {e}")
        return {"match": False}

def store_match(action_id: str, manifesto_item_id: str, link_type: str, confidence: float, metadata: Dict = None):
    """Store an action-manifesto link."""
    db.table("action_manifesto_links").insert({
        "action_id": action_id,
        "manifesto_item_id": manifesto_item_id,
        "link_type": link_type,
        "ai_confidence": min(1.0, max(0.0, confidence)),
        "human_verified": False,
        "metadata": metadata
    }).execute()

def run():
    """Main entry point for the manifesto matcher agent."""
    run_id = log_agent_run("manifesto_matcher")
    actions_processed = 0
    links_created = 0

    try:
        unmatched_actions = get_unmatched_actions(limit=20)
        if not unmatched_actions:
            logger.info("No unmatched actions found.")
            complete_agent_run(run_id, "success", 0, 0)
            return

        logger.info(f"Processing {len(unmatched_actions)} unmatched actions.")

        for action in unmatched_actions:
            actions_processed += 1
            candidates = find_candidate_matches(action["embedding"])
            
            for candidate in candidates:
                # AI verification
                verification = verify_match_with_ai(action, candidate)
                
                if verification.get("match") and verification.get("link_type"):
                    store_match(
                        action["id"],
                        candidate["id"],
                        verification["link_type"],
                        verification["confidence"],
                        {"reason": verification.get("reason"), "similarity": candidate.get("similarity")}
                    )
                    links_created += 1
                    logger.info(f"  Matched: '{action['title_en'][:40]}...' -> {candidate['source_id']} ({verification['link_type']})")

        complete_agent_run(run_id, "success", actions_processed, links_created)
        logger.info(f"Completed run. Processed {actions_processed} actions, created {links_created} links.")

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", actions_processed, links_created, str(e))
        raise

if __name__ == "__main__":
    run()
