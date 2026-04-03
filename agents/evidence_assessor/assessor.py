"""
Drishti Nepal — Evidence Assessor Agent
Drafts Tier 3 evidence-based probability assessments for manifesto initiatives.

Schedule: On new initiatives (triggered after manifesto_matcher or gazette_monitor)
Sources: Research databases, World Bank evaluations, comparable country data

The assessor uses quality AI (Claude Sonnet / advanced model) to draft probability
assessments with citations. These go into the review queue for community editors
and domain experts to approve before affecting scores.
"""

import json
from datetime import datetime, timezone

from agents.common.db import db
from agents.common.ai import quality_completion
from agents.common.utils import (
    setup_logger,
    log_agent_run,
    complete_agent_run,
    parse_ai_json,
)

logger = setup_logger("evidence_assessor")

# Max items to assess per run (to control AI costs)
MAX_ASSESSMENTS_PER_RUN = 10


def get_unassessed_items(limit: int = MAX_ASSESSMENTS_PER_RUN) -> list[dict]:
    """Get manifesto items that need evidence assessments.

    Targets items that are in_progress or partially_fulfilled but have no
    approved/under_review evidence assessment.
    """
    # Get items with active statuses
    active_items = (
        db.table("manifesto_items")
        .select(
            "id, source_id, title_en, item_text_en, key_commitments, status, target_metrics, category"
        )
        .in_("status", ["in_progress", "partially_fulfilled"])
        .execute()
    )

    if not active_items.data:
        # Fall back to not_started items if no active ones
        active_items = (
            db.table("manifesto_items")
            .select(
                "id, source_id, title_en, item_text_en, key_commitments, status, target_metrics, category"
            )
            .eq("status", "not_started")
            .eq("document_type", "bachha_patra")
            .limit(limit)
            .execute()
        )

    if not active_items.data:
        return []

    item_ids = [item["id"] for item in active_items.data]

    # Find which ones already have assessments
    existing = (
        db.table("initiative_evidence")
        .select("manifesto_item_id")
        .in_("manifesto_item_id", item_ids)
        .in_("status", ["approved", "under_review", "draft"])
        .execute()
    )
    assessed_ids = {e["manifesto_item_id"] for e in existing.data}

    # Return unassessed items
    unassessed = [item for item in active_items.data if item["id"] not in assessed_ids]
    return unassessed[:limit]


def get_related_actions(manifesto_item_id: str) -> list[dict]:
    """Get actions linked to a manifesto item for context."""
    links = (
        db.table("action_manifesto_links")
        .select(
            "action_id, link_type, confidence, actions(title_en, description_en, action_date, category)"
        )
        .eq("manifesto_item_id", manifesto_item_id)
        .order("actions(action_date)", desc=True)
        .limit(5)
        .execute()
    )
    return links.data


def get_related_gazette(manifesto_item_id: str) -> list[dict]:
    """Get gazette entries linked to a manifesto item."""
    entries = (
        db.table("gazette_entries")
        .select("title_en, summary_en, category, published_date, significance")
        .eq("manifesto_item_id", manifesto_item_id)
        .order("published_date", desc=True)
        .limit(3)
        .execute()
    )
    return entries.data


def get_outcome_indicators(manifesto_item_id: str) -> list[dict]:
    """Get outcome indicators for the manifesto item."""
    indicators = (
        db.table("outcome_indicators")
        .select(
            "indicator_name, indicator_label, baseline_value, current_value, target_value, unit, measured_date"
        )
        .eq("manifesto_item_id", manifesto_item_id)
        .execute()
    )
    return indicators.data


def draft_assessment(
    item: dict, actions: list, gazette: list, indicators: list
) -> dict:
    """Use quality AI to draft an evidence-based probability assessment."""
    commitments = item.get("key_commitments") or []
    commitments_str = (
        "\n".join(f"- {c}" for c in commitments)
        if commitments
        else "(no specific commitments listed)"
    )
    targets = (
        json.dumps(item.get("target_metrics") or {}, indent=2)
        if item.get("target_metrics")
        else "(no quantified targets)"
    )

    actions_str = ""
    if actions:
        for a in actions[:5]:
            act = a.get("actions") or {}
            actions_str += f"- [{a.get('link_type', 'related')}] {act.get('title_en', 'N/A')} ({act.get('action_date', 'N/A')})\n"
    else:
        actions_str = "(no linked government actions yet)"

    gazette_str = ""
    if gazette:
        for g in gazette:
            gazette_str += f"- [{g.get('category', 'general')}] {g.get('title_en', 'N/A')} ({g.get('published_date', 'N/A')}) — {g.get('significance', 'medium')}\n"
    else:
        gazette_str = "(no gazette entries linked)"

    indicator_str = ""
    if indicators:
        for ind in indicators:
            indicator_str += f"- {ind.get('indicator_label', ind.get('indicator_name', 'N/A'))}: baseline={ind.get('baseline_value', 'N/A')}, current={ind.get('current_value', 'N/A')}, target={ind.get('target_value', 'N/A')} {ind.get('unit', '')}\n"
    else:
        indicator_str = "(no outcome indicators linked)"

    prompt = f"""You are assessing the likelihood that a Nepal government initiative will achieve its stated goals.

## Manifesto Item: {item.get('source_id', '')} — {item.get('title_en', '')}

### Full text:
{item.get('item_text_en', '(not available)')}

### Key Commitments:
{commitments_str}

### Quantified Targets:
{targets}

### Current Status: {item.get('status', 'unknown')}

### Government Actions Taken:
{actions_str}

### Official Gazette Entries:
{gazette_str}

### Outcome Indicators:
{indicator_str}

## Your Task

Assess the probability (0.0 to 1.0) that this initiative will achieve its stated goals within the government's term (by 2031).

Consider:
1. **International evidence**: What do World Bank, OECD, ADB, IMF evaluations say about similar reforms in comparable countries?
2. **Nepal-specific context**: Previous government attempts, institutional capacity, political economy constraints
3. **Current momentum**: Based on actions taken so far, gazette entries, and indicator trends
4. **Resource adequacy**: Is the implied budget/capacity realistic for the stated ambition?
5. **Timeline feasibility**: Can this realistically be achieved in the remaining time?

Return a JSON object with:
- "probability": number between 0.0 and 1.0
- "assessment_en": 2-3 paragraph analysis (max 500 words) stating your reasoning
- "confidence_level": "high", "medium", or "low" — how confident you are in this assessment
- "key_risks": list of 2-4 main risks that could prevent success
- "citations": list of objects with "title", "source", "year" — cite real, verifiable sources (World Bank reports, ADB evaluations, OECD studies, CBS data, academic papers). Do NOT fabricate citations.

Respond ONLY with the JSON object. No markdown fences."""

    system = (
        "You are an international development economist specializing in South Asia, "
        "with deep expertise in Nepal's political economy, public administration, and "
        "evidence-based policy evaluation. You provide objective, calibrated probability "
        "assessments grounded in verifiable evidence. You never fabricate citations."
    )

    try:
        response = quality_completion(prompt, system=system, max_tokens=2000)
        result = parse_ai_json(response)
        if not result:
            raise ValueError("Failed to parse AI response as JSON")

        # Validate probability
        prob = result.get("probability", 0.5)
        result["probability"] = max(0.0, min(1.0, float(prob)))

        return result
    except Exception as e:
        logger.warning(f"AI assessment failed for {item.get('source_id', '')}: {e}")
        return {
            "probability": 0.5,
            "assessment_en": f"Assessment could not be generated automatically. Manual review required for: {item.get('title_en', '')}",
            "confidence_level": "low",
            "key_risks": ["Assessment generation failed"],
            "citations": [],
        }


def store_assessment(item_id: str, assessment: dict) -> str:
    """Store an evidence assessment and queue it for review."""
    record = {
        "manifesto_item_id": item_id,
        "probability": assessment["probability"],
        "assessment_en": assessment.get("assessment_en", ""),
        "citations": assessment.get("citations", []),
        "status": "draft",
        "assessed_at": datetime.now(timezone.utc).isoformat(),
        "metadata": {
            "confidence_level": assessment.get("confidence_level", "medium"),
            "key_risks": assessment.get("key_risks", []),
            "auto_generated": True,
        },
    }

    result = db.table("initiative_evidence").insert(record).execute()
    evidence_id = result.data[0]["id"]

    # Queue for editor review
    db.table("content_review_queue").insert(
        {
            "content_type": "evidence_assessment",
            "content_id": evidence_id,
            "priority": "high",
            "status": "pending",
            "title": f"Evidence assessment for {assessment.get('assessment_en', '')[:100]}",
            "ai_confidence": assessment["probability"],
        }
    ).execute()

    return evidence_id


def run():
    """Main entry point for the evidence assessor agent."""
    run_id = log_agent_run("evidence_assessor")
    items_processed = 0
    items_created = 0

    try:
        unassessed = get_unassessed_items()
        logger.info(
            f"Found {len(unassessed)} manifesto items needing evidence assessment"
        )

        for item in unassessed:
            items_processed += 1
            source_id = item.get("source_id", "")
            title = item.get("title_en", "")
            logger.info(f"Assessing: {source_id} — {title[:60]}")

            # Gather context
            actions = get_related_actions(item["id"])
            gazette = get_related_gazette(item["id"])
            indicators = get_outcome_indicators(item["id"])

            # Draft assessment
            assessment = draft_assessment(item, actions, gazette, indicators)

            # Store
            store_assessment(item["id"], assessment)
            items_created += 1

            logger.info(
                f"  → P({assessment['probability']:.2f}) "
                f"[{assessment.get('confidence_level', 'medium')}] "
                f"Queued for review"
            )

        logger.info(
            f"Evidence Assessor: {items_created} assessments drafted from {items_processed} items"
        )
        complete_agent_run(run_id, "success", items_processed, items_created)

    except Exception as e:
        logger.error(f"Evidence Assessor failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_created, str(e))
        raise
