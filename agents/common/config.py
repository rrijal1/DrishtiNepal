"""
Drishti Nepal - Configuration
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Minister name list for keyword filtering (update when cabinet changes)
MINISTER_KEYWORDS = [
    # Add minister names in both English and Nepali transliteration
    # Example entries - replace with actual cabinet members
]

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
        "name": "ratopati",
        "base_url": "https://ratopati.com",
        "rss_url": "https://ratopati.com/feed",
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
    {
        "name": "nagarik",
        "base_url": "https://nagariknews.nagariknetwork.com",
        "rss_url": "https://nagariknews.nagariknetwork.com/feed",
        "language": "np",
        "type": "rss",
        "category": "news",
    },
    {
        "name": "himalayakhabar",
        "base_url": "https://www.himalayakhabar.com",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
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
        "name": "nepalitimes",
        "base_url": "https://www.nepalitimes.com",
        "rss_url": "https://www.nepalitimes.com/feed/",
        "language": "en",
        "type": "rss",
        "category": "news",
    },
    {
        "name": "recordnepal",
        "base_url": "https://www.recordnepal.com",
        "rss_url": None,
        "language": "en",
        "type": "scrape",
        "category": "news",
    },
    {
        "name": "theannapurnaexpress",
        "base_url": "https://theannapurnaexpress.com",
        "rss_url": "https://theannapurnaexpress.com/feed",
        "language": "en",
        "type": "rss",
        "category": "news",
    },
    {
        "name": "myrepublica",
        "base_url": "https://myrepublica.nagariknetwork.com",
        "rss_url": "https://myrepublica.nagariknetwork.com/feed",
        "language": "en",
        "type": "rss",
        "category": "news",
    },
]

# Government / Official Sources (whitelisted)
GOVERNMENT_SOURCES = [
    {
        "name": "nepal_gazette",
        "base_url": "https://rajpatra.dop.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "Nepal Gazette (Rajpatra) - Official government decisions",
    },
    {
        "name": "opmcm",
        "base_url": "https://www.opmcm.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "Office of the Prime Minister and Council of Ministers",
    },
    {
        "name": "parliament",
        "base_url": "https://hr.parliament.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "House of Representatives - Parliamentary proceedings",
    },
    {
        "name": "national_assembly",
        "base_url": "https://na.parliament.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "National Assembly",
    },
    {
        "name": "mof",
        "base_url": "https://www.mof.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "Ministry of Finance - Budget, economic policy",
    },
    {
        "name": "npc",
        "base_url": "https://npc.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "National Planning Commission",
    },
    {
        "name": "oag",
        "base_url": "https://www.oag.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "Office of the Auditor General - Audit reports",
    },
    {
        "name": "election_commission",
        "base_url": "https://election.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "Election Commission of Nepal",
    },
    {
        "name": "ciaa",
        "base_url": "https://ciaa.gov.np",
        "rss_url": None,
        "language": "np",
        "type": "scrape",
        "category": "official",
        "description": "Commission for Investigation of Abuse of Authority",
    },
]

# Combined list for the scraper agent
NEWS_SOURCES = NEWS_SOURCES_NEPALI + NEWS_SOURCES_ENGLISH

# Scoring weights
SCORING_WEIGHTS = {
    "manifesto_compliance": 0.30,
    "policy_effectiveness": 0.20,
    "transparency": 0.15,
    "financial_prudence": 0.15,
    "public_sentiment": 0.10,
    "parliamentary_activity": 0.10,
}

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
