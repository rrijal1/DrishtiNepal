"""
Drishti Nepal - AI Client (Multi-provider, cost-optimized)
Uses cheap models for routine tasks, quality models for analysis.
"""

import os
import anthropic
from dotenv import load_dotenv

load_dotenv()

_anthropic_client = None


def get_anthropic_client() -> anthropic.Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _anthropic_client


def cheap_completion(prompt: str, system: str = "", max_tokens: int = 1024) -> str:
    """Use cheap model (Haiku) for routine tasks: extraction, classification, translation."""
    client = get_anthropic_client()
    model = os.environ.get("AI_MODEL_CHEAP", "claude-3-5-haiku-20241022")
    messages = [{"role": "user", "content": prompt}]
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=(
            system
            if system
            else "You are a helpful assistant for Drishti Nepal, a political accountability platform tracking Nepal's cabinet ministers."
        ),
        messages=messages,
    )
    return response.content[0].text


def quality_completion(prompt: str, system: str = "", max_tokens: int = 4096) -> str:
    """Use quality model (Sonnet) for analysis, scholarly content, complex matching."""
    client = get_anthropic_client()
    model = os.environ.get("AI_MODEL_QUALITY", "claude-sonnet-4-20250514")
    messages = [{"role": "user", "content": prompt}]
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=(
            system
            if system
            else "You are a senior political analyst for Drishti Nepal, providing objective, balanced analysis of Nepal's governance and cabinet performance."
        ),
        messages=messages,
    )
    return response.content[0].text
