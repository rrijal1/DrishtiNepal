"""
Drishti Nepal - Agent Scheduler
Runs all agents on their configured schedules using cron-style scheduling.
Designed to run as a long-lived process on a VPS.
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

    # News scraper: every 30 minutes
    schedule.every(30).minutes.do(safe_run("news_scraper", news_scraper_run))

    # Content generator: every hour (processes raw news into posts)
    schedule.every(1).hour.do(safe_run("content_generator", content_generator_run))

    # Social publisher: every 2 hours
    schedule.every(2).hours.do(safe_run("social_publisher", social_publisher_run))

    # Manifesto matcher: every 12 hours
    schedule.every(12).hours.do(safe_run("manifesto_matcher", manifesto_matcher_run))

    # Scoring: daily at midnight Nepal time (UTC+5:45 → 18:15 UTC previous day)
    schedule.every().day.at("18:15").do(safe_run("scoring_agent", scoring_run))

    logger.info("Schedule configured:")
    logger.info("  news_scraper      : every 30 min")
    logger.info("  content_generator : every 1 hour")
    logger.info("  social_publisher  : every 2 hours")
    logger.info("  manifesto_matcher : every 12 hours")
    logger.info("  scoring_agent     : daily at 00:00 NPT")


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
