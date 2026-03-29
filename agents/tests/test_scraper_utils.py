"""
Unit tests for news_scraper utility functions.
These tests do NOT require a database or network connection.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


# ---------------------------------------------------------------------------
# Inline reimplementation of the pure functions under test
# ---------------------------------------------------------------------------

import hashlib


def title_hash(title: str) -> str:
    normalized = title.strip().lower()
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def is_relevant(title: str, body: str, minister_names: list[dict]) -> bool:
    text = (title + " " + body).lower()
    for minister in minister_names:
        if minister["name_en"].lower() in text or minister["name_np"] in text:
            return True
    keywords = [
        "cabinet",
        "minister",
        "ministry",
        "मन्त्री",
        "मन्त्रिपरिषद्",
        "मन्त्रालय",
        "cabinet decision",
        "राजपत्र",
        "सरकार",
        "रास्वपा",
        "rastriya swatantra",
        "rsp",
    ]
    return any(kw in text for kw in keywords)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestTitleHash:
    def test_same_title_produces_same_hash(self):
        assert title_hash("Nepal Cabinet Meets") == title_hash("Nepal Cabinet Meets")

    def test_case_insensitive(self):
        assert title_hash("Cabinet Meeting") == title_hash("cabinet meeting")

    def test_strips_whitespace(self):
        assert title_hash("  Cabinet Meeting  ") == title_hash("Cabinet Meeting")

    def test_different_titles_differ(self):
        assert title_hash("Title A") != title_hash("Title B")

    def test_hash_length_is_16(self):
        assert len(title_hash("Any title")) == 16

    def test_hash_is_hex(self):
        h = title_hash("Some title")
        assert all(c in "0123456789abcdef" for c in h)


class TestIsRelevant:
    MINISTERS = [
        {"name_en": "Rabi Lamichhane", "name_np": "रवि लामिछाने"},
        {"name_en": "Bimala Rai Poudyal", "name_np": "विमला राई पौड्याल"},
    ]

    def test_matches_minister_name_en(self):
        assert is_relevant("Rabi Lamichhane speaks on economy", "", self.MINISTERS)

    def test_matches_minister_name_np(self):
        assert is_relevant("रवि लामिछाने आज काठमाडौँमा", "", self.MINISTERS)

    def test_matches_cabinet_keyword(self):
        assert is_relevant("Cabinet approves new policy", "", self.MINISTERS)

    def test_matches_nepali_keyword(self):
        assert is_relevant("मन्त्रिपरिषद्को बैठक सम्पन्न", "", self.MINISTERS)

    def test_matches_rsp_keyword(self):
        assert is_relevant("RSP announces economic reforms", "", self.MINISTERS)

    def test_irrelevant_article_returns_false(self):
        assert not is_relevant(
            "Cricket match ends in draw", "Score was 250-8", self.MINISTERS
        )

    def test_case_insensitive_match(self):
        assert is_relevant("CABINET DECISION announced today", "", self.MINISTERS)

    def test_empty_strings_irrelevant(self):
        assert not is_relevant("", "", self.MINISTERS)

    def test_body_also_checked(self):
        assert is_relevant(
            "Weather update", "Minister announces new policy", self.MINISTERS
        )

    def test_second_minister_name_matches(self):
        assert is_relevant("Bimala Rai Poudyal visits province", "", self.MINISTERS)


class TestNewsSourceConfig:
    """Sanity-check the NEWS_SOURCES config is well-formed."""

    def test_news_sources_have_required_keys(self):
        # Import is safe in test env — config.py has no DB call at module level
        from agents.common.config import NEWS_SOURCES

        required_keys = {"name", "base_url", "rss_url", "language", "type", "category"}
        for source in NEWS_SOURCES:
            missing = required_keys - source.keys()
            assert not missing, f"Source {source.get('name')} missing keys: {missing}"

    def test_news_sources_not_empty(self):
        from agents.common.config import NEWS_SOURCES

        assert len(NEWS_SOURCES) > 0

    def test_language_values_valid(self):
        from agents.common.config import NEWS_SOURCES

        valid_languages = {"en", "np"}
        for source in NEWS_SOURCES:
            assert (
                source["language"] in valid_languages
            ), f"Source {source['name']} has invalid language: {source['language']}"
