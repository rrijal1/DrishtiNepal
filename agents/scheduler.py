"""
Drishti Nepal - Agent Scheduler
Two modes:
  1. GitHub Actions cron (production): use `python -m agents.run <agent>`
  2. Long-running process (local dev): `python -m agents.scheduler`
"""

import schedule
import time
import traceback

from agents.common.utils import setup_logger

logger = setup_logger("scheduler")


def safe_run(agent_name: str, run_func):
    """Wrapper that catches exceptions so one agent failure doesn't crash the scheduler."""

    def wrapper():
        logger.info(f"Starting agent: {agent_name}")
        try:
            run_func()
            logger.info(f"Completed agent: {agent_name}")
        except Exception as e:
            logger.error(f"Agent {agent_name} failed: {e}\n{traceback.format_exc()}")

    return wrapper


def setup_schedule():
    """Configure all agent schedules."""
    from agents.news_scraper.scraper import run as news_scraper_run
    from agents.content_generator.generator import run as content_generator_run
    from agents.social_publisher.publisher import run as social_publisher_run
    from agents.scoring_agent.scorer import run as scoring_run
    from agents.manifesto_matcher.matcher import run as manifesto_matcher_run

    # News scraper: 3x/day — morning, midday, evening NPT
    # NPT (UTC+5:45): 07:00 NPT = 01:15 UTC, 13:00 NPT = 07:15 UTC, 20:00 NPT = 14:15 UTC
    schedule.every().day.at("01:15").do(safe_run("news_scraper", news_scraper_run))
    schedule.every().day.at("07:15").do(safe_run("news_scraper", news_scraper_run))
    schedule.every().day.at("14:15").do(safe_run("news_scraper", news_scraper_run))

    # Content generator: runs after each scrape window (30 min offset)
    schedule.every().day.at("01:45").do(
        safe_run("content_generator", content_generator_run)
    )
    schedule.every().day.at("07:45").do(
        safe_run("content_generator", content_generator_run)
    )
    schedule.every().day.at("14:45").do(
        safe_run("content_generator", content_generator_run)
    )

    # Social publisher: after content generation (1 hr offset from scrape)
    schedule.every().day.at("02:15").do(
        safe_run("social_publisher", social_publisher_run)
    )
    schedule.every().day.at("08:15").do(
        safe_run("social_publisher", social_publisher_run)
    )
    schedule.every().day.at("15:15").do(
        safe_run("social_publisher", social_publisher_run)
    )

    # Manifesto matcher: once daily (evening NPT)
    schedule.every().day.at("15:00").do(
        safe_run("manifesto_matcher", manifesto_matcher_run)
    )

    # Scoring: daily at midnight Nepal time (UTC+5:45 → 18:15 UTC previous day)
    schedule.every().day.at("18:15").do(safe_run("scoring_agent", scoring_run))

    logger.info("Schedule configured (all times UTC):")
    logger.info("  news_scraper      : 01:15, 07:15, 14:15  (07:00, 13:00, 20:00 NPT)")
    logger.info("  content_generator : 01:45, 07:45, 14:45")
    logger.info("  social_publisher  : 02:15, 08:15, 15:15")
    logger.info("  manifesto_matcher : 15:00  (20:45 NPT)")
    logger.info("  scoring_agent     : 18:15  (00:00 NPT)")


def main():
    logger.info("Drishti Nepal Agent Scheduler starting...")
    setup_schedule()

    # Run news scraper immediately on startup
    logger.info("Running initial scrape...")
    from agents.news_scraper.scraper import run as news_scraper_run

    safe_run("news_scraper", news_scraper_run)()

    logger.info("Entering schedule loop...")
    while True:
        schedule.run_pending()
        time.sleep(30)  # Check every 30 seconds


if __name__ == "__main__":
    main()
