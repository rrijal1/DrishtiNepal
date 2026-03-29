"""
Drishti Nepal - Image Enricher Agent
Finds and attaches a main image URL to posts that are missing one.
"""

import asyncio
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict, Optional

from agents.common.db import db
from agents.common.utils import setup_logger, log_agent_run, complete_agent_run

logger = setup_logger("image_enricher")
HTTP_TIMEOUT = 20  # seconds

def get_posts_without_images(limit: int = 25) -> List[Dict]:
    """Fetch published posts that don't have an image_url yet."""
    try:
        result = (
            db.table("posts")
            .select("id, source_url")
            .eq("status", "published")
            .is_("image_url", "null")
            .not_.is_("source_url", "null") # Only try if there's a source to check
            .order("published_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data
    except Exception as e:
        logger.error(f"Failed to fetch posts without images: {e}")
        return []

async def find_image_url_from_source(
    client: httpx.AsyncClient, post: Dict
) -> Optional[str]:
    """
    Given a post with a source_url, fetch the page and parse it
    to find the primary image URL, prioritizing the og:image tag.
    """
    if not post.get("source_url"):
        return None
    
    url = post["source_url"]
    try:
        response = await client.get(url, timeout=HTTP_TIMEOUT, follow_redirects=True)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        
        # Prioritize Open Graph image tag
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            logger.info(f"  Found og:image for post {post['id']}: {og_image['content']}")
            return og_image["content"]

        # Fallback: Look for the first large image in the main content area
        # This is highly site-specific and might not be reliable
        # For now, we'll stick to the reliable og:image
        
        logger.warning(f"  No og:image tag found for {url}")
        return None

    except httpx.HTTPStatusError as e:
        logger.error(f"  HTTP error fetching {url}: {e}")
    except Exception as e:
        logger.error(f"  Failed to parse or process {url}: {e}")
    return None

async def run():
    """Main entry point for the image enricher agent."""
    run_id = log_agent_run("image_enricher")
    items_processed = 0
    items_enriched = 0

    try:
        posts_to_check = get_posts_without_images()
        items_processed = len(posts_to_check)
        logger.info(f"Found {items_processed} posts missing an image URL.")

        if not posts_to_check:
            complete_agent_run(run_id, "success", 0, 0)
            return

        async with httpx.AsyncClient() as client:
            enrich_tasks = [find_image_url_from_source(client, post) for post in posts_to_check]
            image_urls = await asyncio.gather(*enrich_tasks)

        updates = []
        for i, post in enumerate(posts_to_check):
            if image_urls[i]:
                updates.append({
                    "id": post["id"],
                    "image_url": image_urls[i]
                })

        if not updates:
            logger.info("No images found in this run.")
            complete_agent_run(run_id, "success", items_processed, 0)
            return
            
        logger.info(f"Found {len(updates)} images. Updating database...")
        for update in updates:
            try:
                db.table("posts").update({"image_url": update["image_url"]}).eq("id", update["id"]).execute()
                items_enriched += 1
            except Exception as e:
                logger.error(f"Failed to update post {update['id']} with image_url: {e}")

        complete_agent_run(run_id, "success", items_processed, items_enriched)
        logger.info(f"Completed run. Processed: {items_processed}, Enriched: {items_enriched}")

    except Exception as e:
        logger.error(f"Agent failed: {e}", exc_info=True)
        complete_agent_run(run_id, "error", items_processed, items_enriched, str(e))
        raise

if __name__ == "__main__":
    asyncio.run(run())
