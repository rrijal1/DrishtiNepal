"""
Drishti Nepal - Agent CLI Runner
Used by GitHub Actions cron jobs to run individual agents.
Usage: python -m agents.run <agent_name>
"""

import sys
import traceback

from agents.common.utils import setup_logger

logger = setup_logger("runner")

AGENTS = {
    "scraper": ("agents.news_scraper.scraper", "News Scraper"),
    "generator": ("agents.content_generator.generator", "Content Generator"),
    "extractor": ("agents.action_extractor", "Action Extractor"),
    "enricher": ("agents.image_enricher.enricher", "Image Enricher"),
    "publisher": ("agents.social_publisher.publisher", "Social Publisher"),
    "matcher": ("agents.manifesto_matcher.matcher", "Manifesto Matcher"),
    "scorer": ("agents.scoring_agent.scorer", "Scoring Agent"),
    "outcome": ("agents.outcome_tracker.tracker", "Outcome Tracker"),
    "gazette": ("agents.gazette_monitor.monitor", "Gazette Monitor"),
    "parliament": ("agents.parliament_tracker.tracker", "Parliament Tracker"),
    "opendata": ("agents.open_data_monitor.monitor", "Open Data Monitor"),
    "evidence": ("agents.evidence_assessor.assessor", "Evidence Assessor"),
    "manual": ("agents.manual_ingester.ingester", "Manual Link Ingester"),
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in AGENTS:
        print(f"Usage: python -m agents.run <{'|'.join(AGENTS.keys())}>")
        sys.exit(1)

    agent_key = sys.argv[1]
    module_path, display_name = AGENTS[agent_key]

    logger.info(f"Starting {display_name}...")
    try:
        # Dynamic import
        module = __import__(module_path, fromlist=["run"])
        run_func = module.run

        # Check if it's a coroutine function
        import asyncio
        import inspect

        if inspect.iscoroutinefunction(run_func):
            asyncio.run(run_func())
        else:
            run_func()

        logger.info(f"{display_name} completed successfully.")
    except Exception as e:
        logger.error(f"{display_name} failed: {e}\n{traceback.format_exc()}")
        sys.exit(1)


if __name__ == "__main__":
    main()
