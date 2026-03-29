"""
Drishti Nepal - AI Client (Multi-provider, cost-optimized)
Primary: NVIDIA NIM free tier (Qwen/DeepSeek via OpenAI-compatible API)
Fallback: Anthropic (Claude)
"""

import os
import anthropic
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_nvidia_client = None
_anthropic_client = None


def _use_nvidia() -> bool:
    return bool(os.environ.get("NVIDIA_API_KEY"))


def get_nvidia_client() -> OpenAI:
    global _nvidia_client
    if _nvidia_client is None:
        _nvidia_client = OpenAI(
            base_url=os.environ.get(
                "NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"
            ),
            api_key=os.environ["NVIDIA_API_KEY"],
        )
    return _nvidia_client


def get_anthropic_client() -> anthropic.Anthropic:
    global _anthropic_client
    if _anthropic_client is None:
        key = os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise EnvironmentError(
                "No AI provider configured: set NVIDIA_API_KEY (preferred) or ANTHROPIC_API_KEY"
            )
        _anthropic_client = anthropic.Anthropic(api_key=key)
    return _anthropic_client


def _nvidia_completion(prompt: str, system: str, model: str, max_tokens: int) -> str:
    client = get_nvidia_client()
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def cheap_completion(prompt: str, system: str = "", max_tokens: int = 1024) -> str:
    """Routine tasks: extraction, classification, translation.
    Uses NVIDIA NIM (free) if configured, otherwise falls back to Anthropic Haiku."""
    default_system = "You are a helpful assistant for Drishti Nepal, a political accountability platform tracking Nepal's cabinet ministers."
    system = system or default_system

    if _use_nvidia():
        model = os.environ.get(
            "NVIDIA_MODEL_CHEAP", os.environ.get("NVIDIA_MODEL", "qwen/qwen3-235b-a22b")
        )
        return _nvidia_completion(prompt, system, model, max_tokens)

    client = get_anthropic_client()
    model = os.environ.get("AI_MODEL_CHEAP", "claude-3-5-haiku-20241022")
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


def quality_completion(prompt: str, system: str = "", max_tokens: int = 4096) -> str:
    """Analysis, scholarly content, complex matching.
    Uses NVIDIA NIM (free) if configured, otherwise falls back to Anthropic Sonnet."""
    default_system = "You are a senior political analyst for Drishti Nepal, providing objective, balanced analysis of Nepal's governance and cabinet performance."
    system = system or default_system

    if _use_nvidia():
        model = os.environ.get(
            "NVIDIA_MODEL_QUALITY",
            os.environ.get("NVIDIA_MODEL", "qwen/qwen3-235b-a22b"),
        )
        return _nvidia_completion(prompt, system, model, max_tokens)

    client = get_anthropic_client()
    model = os.environ.get("AI_MODEL_QUALITY", "claude-sonnet-4-20250514")
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text
