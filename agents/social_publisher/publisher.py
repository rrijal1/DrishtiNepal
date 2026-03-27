"""
Drishti Nepal - Social Media Publisher Agent
Publishes new portal posts to Facebook Page (@DrishtiNepalHQ) and X (@DrishtiNepalHQ).
"""

import os
import requests
from datetime import datetime, timezone

from agents.common.db import db
from agents.common.ai import cheap_completion
from agents.common.config import SOCIAL_CONFIG
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("social_publisher")


def get_unpublished_posts(platform: str, limit: int = 5) -> list[dict]:
    """Get published posts that haven't been pushed to a social platform yet."""
    col = "fb_published" if platform == "fb" else "x_published"
    result = (
        db.table("posts")
        .select("*")
        .eq("status", "published")
        .eq(col, False)
        .order("published_at", desc=False)
        .limit(limit)
        .execute()
    )
    return result.data


def generate_social_text(post: dict, platform: str) -> str:
    """AI-generate optimized social media text."""
    max_chars = (
        SOCIAL_CONFIG["x_max_chars"]
        if platform == "x"
        else SOCIAL_CONFIG["fb_max_chars"]
    )
    language = "Nepali" if platform == "fb" else "English"

    prompt = f"""Write a {language} social media post for {'X/Twitter' if platform == 'x' else 'Facebook'}.

Article title: {post['title_en']}
Article excerpt: {post.get('excerpt_en', '')}

Rules:
- Maximum {max_chars} characters
- Include relevant hashtags (2-3 max)
- {'Use Nepali language (Devanagari script)' if platform == 'fb' else 'Use English'}
- Professional, factual tone
- Include a call to action to read full article
- Add #DrishtiNepal #दृष्टिनेपाल #NepaliPolitics

Return ONLY the social media text, nothing else."""

    return cheap_completion(prompt, max_tokens=256).strip()


def publish_to_x(text: str, article_url: str) -> str | None:
    """Publish a post to X (Twitter) using API v2."""
    bearer_token = os.environ.get("X_BEARER_TOKEN", "")
    if not bearer_token:
        logger.warning("X_BEARER_TOKEN not configured, skipping X publish")
        return None

    # Using OAuth 1.0a for posting
    import hmac
    import hashlib
    import base64
    import urllib.parse
    import time
    import uuid

    api_key = os.environ.get("X_API_KEY", "")
    api_secret = os.environ.get("X_API_SECRET", "")
    access_token = os.environ.get("X_ACCESS_TOKEN", "")
    access_secret = os.environ.get("X_ACCESS_SECRET", "")

    if not all([api_key, api_secret, access_token, access_secret]):
        logger.warning("X API credentials incomplete, skipping")
        return None

    url = "https://api.twitter.com/2/tweets"
    payload = {"text": f"{text}\n\n{article_url}"}

    # Build OAuth 1.0a header
    oauth_nonce = uuid.uuid4().hex
    oauth_timestamp = str(int(time.time()))

    oauth_params = {
        "oauth_consumer_key": api_key,
        "oauth_nonce": oauth_nonce,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": oauth_timestamp,
        "oauth_token": access_token,
        "oauth_version": "1.0",
    }

    # Create signature base string
    params_string = "&".join(
        f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}"
        for k, v in sorted(oauth_params.items())
    )
    base_string = f"POST&{urllib.parse.quote(url, safe='')}&{urllib.parse.quote(params_string, safe='')}"
    signing_key = f"{urllib.parse.quote(api_secret, safe='')}&{urllib.parse.quote(access_secret, safe='')}"
    signature = base64.b64encode(
        hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()
    ).decode()

    oauth_params["oauth_signature"] = signature
    auth_header = "OAuth " + ", ".join(
        f'{k}="{urllib.parse.quote(v, safe="")}"'
        for k, v in sorted(oauth_params.items())
    )

    try:
        response = requests.post(
            url,
            json=payload,
            headers={
                "Authorization": auth_header,
                "Content-Type": "application/json",
            },
            timeout=30,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("data", {}).get("id")
    except Exception as e:
        logger.error(f"X publish failed: {e}")
        return None


def publish_to_fb(text: str, article_url: str) -> str | None:
    """Publish a post to Facebook Page using Graph API."""
    page_id = os.environ.get("FB_PAGE_ID", "")
    access_token = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")

    if not page_id or not access_token:
        logger.warning("Facebook credentials not configured, skipping")
        return None

    url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
    payload = {
        "message": text,
        "link": article_url,
        "access_token": access_token,
    }

    try:
        response = requests.post(url, data=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        return data.get("id")
    except Exception as e:
        logger.error(f"Facebook publish failed: {e}")
        return None


def run():
    """Main entry point for the social publisher agent."""
    run_id = log_agent_run("social_publisher")
    items_processed = 0
    items_created = 0
    site_url = os.environ.get("NEXT_PUBLIC_SITE_URL", "https://drishtinepal.com")

    try:
        # Publish to X
        x_posts = get_unpublished_posts("x", limit=SOCIAL_CONFIG["max_posts_per_day_x"])
        for post in x_posts:
            items_processed += 1
            article_url = f"{site_url}/articles/{post['slug']}"
            text = generate_social_text(post, "x")
            x_id = publish_to_x(text, article_url)
            if x_id:
                db.table("posts").update({"x_published": True, "x_post_id": x_id}).eq(
                    "id", post["id"]
                ).execute()
                items_created += 1
                logger.info(f"Published to X: {post['title_en'][:50]}...")

        # Publish to Facebook
        fb_posts = get_unpublished_posts(
            "fb", limit=SOCIAL_CONFIG["max_posts_per_day_fb"]
        )
        for post in fb_posts:
            items_processed += 1
            article_url = f"{site_url}/articles/{post['slug']}"
            text = generate_social_text(post, "fb")
            fb_id = publish_to_fb(text, article_url)
            if fb_id:
                db.table("posts").update(
                    {"fb_published": True, "fb_post_id": fb_id}
                ).eq("id", post["id"]).execute()
                items_created += 1
                logger.info(f"Published to FB: {post['title_en'][:50]}...")

        complete_agent_run(run_id, "success", items_processed, items_created)

    except Exception as e:
        logger.error(f"Agent failed: {e}")
        complete_agent_run(run_id, "error", items_processed, items_created, str(e))
        raise


if __name__ == "__main__":
    run()
