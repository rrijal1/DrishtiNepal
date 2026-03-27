"""
Drishti Nepal - Common Utilities
"""

import hashlib
import logging
import os
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
                "run_started_at": datetime.now(timezone.utc).isoformat(),
                "status": "running",
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
        "run_ended_at": datetime.now(timezone.utc).isoformat(),
        "status": status,
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
