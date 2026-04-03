"""
Drishti Nepal - Common Utilities
"""

import hashlib
import json
import logging
import os
import re
from datetime import datetime, timezone

from .db import db


def setup_logger(name: str) -> logging.Logger:
    level = os.environ.get("LOG_LEVEL", "INFO")
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level))
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(
            logging.Formatter("%(asctime)s [%(name)s] %(levelname)s: %(message)s")
        )
        logger.addHandler(handler)
    return logger


def title_hash(title: str) -> str:
    """Generate a hash for deduplication of news titles."""
    normalized = title.strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def log_agent_run(agent_name: str) -> str:
    """Start an agent log entry, returns the log ID."""
    result = (
        db.table("agent_logs")
        .insert(
            {
                "agent_name": agent_name,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "run_status": "running",
            }
        )
        .execute()
    )
    return result.data[0]["id"]


def complete_agent_run(
    log_id: str,
    status: str,
    items_processed: int = 0,
    items_created: int = 0,
    error: str = None,
):
    """Complete an agent log entry."""
    update = {
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "run_status": status,
        "items_processed": items_processed,
        "items_created": items_created,
    }
    if error:
        update["error_message"] = error[:2000]  # Truncate long errors
    db.table("agent_logs").update(update).eq("id", log_id).execute()


def get_minister_names() -> list[dict]:
    """Fetch active minister names for keyword matching."""
    result = (
        db.table("ministers")
        .select("id, name_en, name_np")
        .eq("status", "active")
        .execute()
    )
    return result.data


def get_minister_map(lowercase_keys: bool = False) -> dict[str, str]:
    """Fetch active ministers and return {name_en: id} mapping."""
    ministers = (
        db.table("ministers")
        .select("id, name_en")
        .eq("status", "active")
        .execute()
        .data
    )
    if lowercase_keys:
        return {m["name_en"].lower(): m["id"] for m in ministers}
    return {m["name_en"]: m["id"] for m in ministers}


def parse_ai_json(response: str, fallback: dict | None = None) -> dict | None:
    """Strip markdown code fences from AI response and parse JSON."""
    text = response.strip()
    cleaned = re.sub(r"```json?\s*|\s*```", "", text).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return fallback


def link_to_manifesto(areas: list[str]) -> str | None:
    """Look up the manifesto_item_id for a priority area."""
    if not areas:
        return None
    for area in areas:
        result = (
            db.table("manifesto_items")
            .select("id")
            .eq("source_id", area)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["id"]
    return None


def queue_for_review(
    content_type: str,
    content_id: str,
    title: str,
    significance: str = "medium",
    record_type: str | None = None,
    ai_confidence: float | None = None,
):
    """Add significant content to the review queue."""
    needs_review = significance in ("critical", "high")
    if record_type:
        needs_review = needs_review or record_type in ("bill", "vote", "resolution")
    if not needs_review:
        return

    priority = "high" if significance in ("critical", "high") else "normal"
    row = {
        "content_type": content_type,
        "content_id": content_id,
        "priority": priority,
        "status": "pending",
        "title": title[:500],
    }
    if ai_confidence is not None:
        row["ai_confidence"] = ai_confidence
    db.table("content_review_queue").insert(row).execute()
