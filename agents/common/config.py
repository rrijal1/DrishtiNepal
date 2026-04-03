"""
Drishti Nepal - Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Party keywords
PARTY_KEYWORDS = [
    "rastriya swatantra party",
    "rsp",
    "रास्वपा",
    "राष्ट्रिय स्वतन्त्र पार्टी",
]

# Ministry keywords
MINISTRY_KEYWORDS = [
    "cabinet",
    "मन्त्रिपरिषद्",
    "finance ministry",
    "अर्थ मन्त्रालय",
    "home ministry",
    "गृह मन्त्रालय",
    "foreign ministry",
    "परराष्ट्र मन्त्रालय",
    "education ministry",
    "शिक्षा मन्त्रालय",
    "health ministry",
    "स्वास्थ्य मन्त्रालय",
]

# ===========================================
# WHITELISTED SOURCES (Approved for scraping)
# ===========================================
# Start small: 6 high-signal sources, expand later.

# Nepali Language News
NEWS_SOURCES_NEPALI = [
    {
        "name": "ekantipur",
        "base_url": "https://ekantipur.com",
        "rss_url": "https://ekantipur.com/rss",
        "language": "np",
        "type": "rss",
        "category": "news",
    },
    {
        "name": "onlinekhabar",
        "base_url": "https://www.onlinekhabar.com",
        "rss_url": "https://www.onlinekhabar.com/feed",
        "language": "np",
        "type": "rss",
        "category": "news",
    },
    {
        "name": "setopati",
        "base_url": "https://www.setopati.com",
        "rss_url": "https://www.setopati.com/feed",
        "language": "np",
        "type": "rss",
        "category": "news",
    },
]

# English Language News
NEWS_SOURCES_ENGLISH = [
    {
        "name": "kathmandupost",
        "base_url": "https://kathmandupost.com",
        "rss_url": "https://kathmandupost.com/rss",
        "language": "en",
        "type": "rss",
        "category": "news",
    },
    {
        "name": "onlinekhabar_en",
        "base_url": "https://english.onlinekhabar.com",
        "rss_url": "https://english.onlinekhabar.com/feed",
        "language": "en",
        "type": "rss",
        "category": "news",
    },
    {
        "name": "setopati_en",
        "base_url": "https://en.setopati.com",
        "rss_url": "https://en.setopati.com/feed",
        "language": "en",
        "type": "rss",
        "category": "news",
    },
]

# Government / Official Sources — disabled for now, enable when scrape is implemented
# GOVERNMENT_SOURCES = [ ... ]

# Combined list for the scraper agent
NEWS_SOURCES = NEWS_SOURCES_NEPALI + NEWS_SOURCES_ENGLISH

# Methodology version — bump whenever scoring logic changes
METHODOLOGY_VERSION = "v1"

# v1 (April 2026): Score = 100% outcome-based.
# minister_score = Σ(weight_i × progress_i) / Σ(weight_i) × 100
# Indicator weights (1–100 scale) are stored per-row in outcome_indicators.weight.
# Initiatives and evidence are displayed but do NOT contribute to the score.

# Social media posting config
SOCIAL_CONFIG = {
    "optimal_posting_hours_npt": [7, 9, 12, 17, 20],  # Nepal time
    "max_posts_per_day_x": 10,
    "max_posts_per_day_fb": 5,
    "x_max_chars": 280,
    "fb_max_chars": 2000,
}

ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
