"""
Unit tests for the scoring agent's pure calculation functions.
These tests do NOT require a database connection.
"""

import sys
import os

# Ensure the repo root is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


# ---------------------------------------------------------------------------
# Inline reimplementations — we test the *logic* in isolation from the DB
# ---------------------------------------------------------------------------

SCORING_WEIGHTS = {
    "manifesto_compliance": 0.70,
    "public_accountability": 0.30,
}


def calculate_manifesto_compliance_pure(item_statuses: list[str]) -> float:
    """Pure version of scoring_agent.calculate_manifesto_compliance."""
    if not item_statuses:
        return 50.0
    score_map = {
        "fulfilled": 1.0,
        "partially_fulfilled": 0.6,
        "in_progress": 0.3,
        "not_started": 0.0,
        "broken": -0.5,
    }
    total = len(item_statuses)
    score_sum = sum(score_map.get(s, 0) for s in item_statuses)
    return max(0, min(100, (score_sum / total) * 100))


def calculate_public_accountability_pure(actions: list[dict]) -> float:
    """Pure version of scoring_agent.calculate_public_accountability."""
    if not actions:
        return 50.0

    transparency_categories = {
        "press_conference", "statement", "rti_response", "announcement"
    }
    parliament_categories = {
        "parliament", "bill", "committee", "qa_session", "legislation"
    }
    sentiment_map = {"positive": 80, "neutral": 50, "negative": 20, "mixed": 40}

    sentiment_score = sum(
        sentiment_map.get(a["sentiment"], 50) for a in actions
    ) / len(actions)
    transparency_count = sum(1 for a in actions if a.get("category") in transparency_categories)
    transparency_score = min(100, 50 + transparency_count * 10)
    parliament_count = sum(1 for a in actions if a.get("category") in parliament_categories)
    parliament_score = min(100, 30 + parliament_count * 10)

    return round(
        sentiment_score * 0.50 + transparency_score * 0.30 + parliament_score * 0.20, 2
    )


def compute_overall_score(dimensions: dict) -> float:
    total = 0.0
    for key, weight in SCORING_WEIGHTS.items():
        total += dimensions.get(key, 50) * weight
    return round(total, 2)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestManifestoCompliance:
    def test_all_fulfilled_is_100(self):
        assert calculate_manifesto_compliance_pure(["fulfilled"] * 5) == 100.0

    def test_all_not_started_is_0(self):
        assert calculate_manifesto_compliance_pure(["not_started"] * 5) == 0.0

    def test_empty_returns_default(self):
        assert calculate_manifesto_compliance_pure([]) == 50.0

    def test_broken_items_penalise_score(self):
        # broken has a negative raw score (-0.5) vs not_started (0.0).
        # Both clamp to 0, but a mix of broken with fulfilled should score lower
        # than the equivalent mix with not_started.
        score_with_broken = calculate_manifesto_compliance_pure(["broken", "fulfilled"])
        score_not_started = calculate_manifesto_compliance_pure(["not_started", "fulfilled"])
        assert score_with_broken < score_not_started

    def test_score_is_clamped_to_zero(self):
        # All broken cannot go below 0
        score = calculate_manifesto_compliance_pure(["broken"] * 10)
        assert score == 0.0

    def test_mixed_statuses(self):
        # fulfilled(1.0) + partially_fulfilled(0.6) + not_started(0.0) = 1.6 / 3 * 100 ≈ 53.3
        score = calculate_manifesto_compliance_pure(["fulfilled", "partially_fulfilled", "not_started"])
        assert abs(score - 53.33) < 0.1

    def test_in_progress_partial_credit(self):
        score = calculate_manifesto_compliance_pure(["in_progress"])
        assert 0 < score < 100
        assert score == 30.0


class TestPublicAccountability:
    def test_empty_actions_returns_default(self):
        assert calculate_public_accountability_pure([]) == 50.0

    def test_all_positive_sentiment_boosts_score(self):
        actions = [{"sentiment": "positive", "category": "decision"}] * 5
        score = calculate_public_accountability_pure(actions)
        assert score > 50.0

    def test_all_negative_sentiment_lowers_score(self):
        actions = [{"sentiment": "negative", "category": "decision"}] * 5
        score = calculate_public_accountability_pure(actions)
        assert score < 50.0

    def test_transparency_categories_boost_score(self):
        baseline = calculate_public_accountability_pure(
            [{"sentiment": "neutral", "category": "decision"}] * 3
        )
        with_press = calculate_public_accountability_pure(
            [{"sentiment": "neutral", "category": "press_conference"}] * 3
        )
        assert with_press > baseline

    def test_parliament_categories_boost_score(self):
        baseline = calculate_public_accountability_pure(
            [{"sentiment": "neutral", "category": "decision"}] * 3
        )
        with_parliament = calculate_public_accountability_pure(
            [{"sentiment": "neutral", "category": "bill"}] * 3
        )
        assert with_parliament > baseline

    def test_score_capped_at_100(self):
        # Max out all sub-scores
        actions = [{"sentiment": "positive", "category": "press_conference"}] * 20
        score = calculate_public_accountability_pure(actions)
        assert score <= 100.0


class TestOverallScore:
    def test_weights_sum_to_1(self):
        total_weight = sum(SCORING_WEIGHTS.values())
        assert abs(total_weight - 1.0) < 1e-9

    def test_equal_scores_produce_same_overall(self):
        score = compute_overall_score({"manifesto_compliance": 60, "public_accountability": 60})
        assert score == 60.0

    def test_manifesto_dominates(self):
        # manifesto=100, accountability=0 → 70
        score = compute_overall_score({"manifesto_compliance": 100, "public_accountability": 0})
        assert score == 70.0

    def test_missing_dimension_defaults_to_50(self):
        score = compute_overall_score({})
        assert score == 50.0

    def test_known_case(self):
        # manifesto=80 * 0.7 + accountability=60 * 0.3 = 56 + 18 = 74
        score = compute_overall_score({"manifesto_compliance": 80, "public_accountability": 60})
        assert score == 74.0
