"""
Unit tests for the scoring agent (v1 — outcome-only model).
Tests do NOT require a database connection — they test pure calculation logic.

The formula under test:
  progress_i = (current - baseline) / (target - baseline)   [higher_is_better]
  progress_i = (baseline - current) / (baseline - target)   [lower_is_better]
  progress_i clamped to [0.0, 1.0]

  minister_score = Σ(weight_i × progress_i) / Σ(weight_i) × 100
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


# ---------------------------------------------------------------------------
# Inline reimplementations — test logic in isolation from DB
# ---------------------------------------------------------------------------


def _indicator_progress(ind: dict) -> float | None:
    """Pure version of scorer._indicator_progress."""
    baseline = ind.get("baseline_value")
    current = ind.get("current_value")
    target = ind.get("target_value")

    if baseline is None or current is None or target is None:
        return None

    direction = ind.get("direction", "higher_is_better")

    if direction == "higher_is_better":
        needed = target - baseline
        achieved = current - baseline
    else:
        needed = baseline - target
        achieved = baseline - current

    if needed == 0:
        return 1.0 if achieved >= 0 else 0.0

    return max(0.0, min(1.0, achieved / needed))


def _minister_score(indicators: list[dict]) -> float | None:
    """Pure version of the weighted-average minister score."""
    total_weight = 0.0
    weighted_sum = 0.0

    for ind in indicators:
        progress = _indicator_progress(ind)
        weight = float(ind.get("weight", 5))
        if progress is not None:
            weighted_sum += progress * weight
            total_weight += weight

    if total_weight == 0:
        return None

    return round(weighted_sum / total_weight * 100, 2)


def _is_indicator_for_minister(ind: dict, portfolio_en: str) -> bool:
    """Pure version of scorer._is_indicator_for_minister."""
    portfolio = portfolio_en.lower().strip()
    primary = ind.get("ministry", "").lower().strip()
    meta = ind.get("metadata") or {}
    shared = [m.lower().strip() for m in meta.get("ministries", [])]
    all_ministries = [m for m in [primary] + shared if m]

    for ministry in all_ministries:
        if ministry == portfolio:
            return True
        if ministry in portfolio:
            return True
        if portfolio in ministry:
            return True

    return False


# ---------------------------------------------------------------------------
# Tests: indicator progress (higher_is_better)
# ---------------------------------------------------------------------------


class TestIndicatorProgressHigherIsBetter:

    def _ind(self, baseline, current, target):
        return {
            "baseline_value": baseline,
            "current_value": current,
            "target_value": target,
            "direction": "higher_is_better",
        }

    def test_at_baseline_is_zero(self):
        assert _indicator_progress(self._ind(1470, 1470, 3000)) == 0.0

    def test_at_target_is_one(self):
        assert _indicator_progress(self._ind(1470, 3000, 3000)) == 1.0

    def test_halfway_is_half(self):
        # (2235 - 1470) / (3000 - 1470) = 765 / 1530 = 0.5
        result = _indicator_progress(self._ind(1470, 2235, 3000))
        assert abs(result - 0.5) < 1e-9

    def test_gdp_example_from_methodology(self):
        # baseline 1500, current 1700, target 3000 → (1700-1500)/(3000-1500) = 200/1500 ≈ 13.3%
        result = _indicator_progress(self._ind(1500, 1700, 3000))
        assert abs(result - 200 / 1500) < 1e-9

    def test_regression_clamped_to_zero(self):
        # current < baseline — regression is NOT rewarded
        result = _indicator_progress(self._ind(1470, 1000, 3000))
        assert result == 0.0

    def test_overshoot_clamped_to_one(self):
        # current > target
        result = _indicator_progress(self._ind(1470, 4000, 3000))
        assert result == 1.0

    def test_missing_baseline_returns_none(self):
        assert _indicator_progress({"current_value": 5, "target_value": 10}) is None

    def test_missing_current_returns_none(self):
        assert _indicator_progress({"baseline_value": 0, "target_value": 10}) is None

    def test_missing_target_returns_none(self):
        assert _indicator_progress({"baseline_value": 0, "current_value": 5}) is None

    def test_zero_gap_already_at_target(self):
        # baseline == target — already achieved
        result = _indicator_progress(self._ind(50, 50, 50))
        assert result == 1.0


# ---------------------------------------------------------------------------
# Tests: indicator progress (lower_is_better)
# ---------------------------------------------------------------------------


class TestIndicatorProgressLowerIsBetter:

    def _ind(self, baseline, current, target):
        return {
            "baseline_value": baseline,
            "current_value": current,
            "target_value": target,
            "direction": "lower_is_better",
        }

    def test_at_baseline_is_zero(self):
        # No improvement yet
        assert _indicator_progress(self._ind(20.3, 20.3, 10.0)) == 0.0

    def test_at_target_is_one(self):
        assert _indicator_progress(self._ind(20.3, 10.0, 10.0)) == 1.0

    def test_halfway(self):
        # baseline=20.3, target=10.0, current=15.15 → (20.3-15.15)/(20.3-10.0) = 5.15/10.3 = 0.5
        result = _indicator_progress(self._ind(20.3, 15.15, 10.0))
        assert abs(result - 0.5) < 1e-6

    def test_worsening_clamped_to_zero(self):
        # Poverty INCREASED — clamp to 0
        result = _indicator_progress(self._ind(20.3, 25.0, 10.0))
        assert result == 0.0

    def test_outperform_target_clamped_to_one(self):
        # Poverty drops below target
        result = _indicator_progress(self._ind(20.3, 8.0, 10.0))
        assert result == 1.0

    def test_ministry_count_exceeds_target(self):
        # baseline=25 (old govt), target=18, current=15 → progress > 1.0 → clamped to 1
        result = _indicator_progress(self._ind(25, 15, 18))
        assert result == 1.0


# ---------------------------------------------------------------------------
# Tests: weighted average minister score
# ---------------------------------------------------------------------------


class TestMinisterScore:

    def _ind(self, baseline, current, target, weight=5, direction="higher_is_better"):
        return {
            "baseline_value": baseline,
            "current_value": current,
            "target_value": target,
            "weight": weight,
            "direction": direction,
        }

    def test_all_at_baseline_is_zero(self):
        indicators = [self._ind(0, 0, 100), self._ind(0, 0, 50)]
        assert _minister_score(indicators) == 0.0

    def test_all_at_target_is_100(self):
        indicators = [self._ind(0, 100, 100), self._ind(0, 50, 50)]
        assert _minister_score(indicators) == 100.0

    def test_equal_weights_is_simple_average(self):
        # 50% progress on one, 0% on another → 25% overall
        indicators = [self._ind(0, 50, 100, weight=5), self._ind(0, 0, 100, weight=5)]
        assert _minister_score(indicators) == 25.0

    def test_higher_weight_dominates(self):
        # 100% on weight=10, 0% on weight=1 → 100*10/(10+1) ≈ 90.9
        indicators = [self._ind(0, 100, 100, weight=10), self._ind(0, 0, 100, weight=1)]
        score = _minister_score(indicators)
        assert abs(score - (100 * 10 / 11)) < 0.01

    def test_no_indicators_returns_none(self):
        assert _minister_score([]) is None

    def test_all_missing_data_returns_none(self):
        indicators = [{"weight": 5}, {"weight": 5}]
        assert _minister_score(indicators) is None

    def test_mixed_directions(self):
        # GDP per capita: baseline 1470, current 2235, target 3000 → 50% → weight 10
        # Poverty: baseline 20.3, current 15.15, target 10.0 → 50% → weight 8
        # Both at 50% → score should be 50
        gdp = self._ind(1470, 2235, 3000, weight=10)
        poverty = self._ind(20.3, 15.15, 10.0, weight=8, direction="lower_is_better")
        assert _minister_score([gdp, poverty]) == 50.0

    def test_gdp_example_from_methodology(self):
        # Month 1: baseline 1500, current 1700, target 3000 → 200/1500 = 13.33%
        gdp = self._ind(1500, 1700, 3000, weight=10)
        score = _minister_score([gdp])
        assert abs(score - (200 / 1500 * 100)) < 0.01


# ---------------------------------------------------------------------------
# Tests: ministry attribution matching
# ---------------------------------------------------------------------------


class TestMinistryAttribution:

    def test_exact_match(self):
        ind = {"ministry": "Finance", "metadata": {}}
        assert _is_indicator_for_minister(ind, "Finance") is True

    def test_case_insensitive(self):
        ind = {"ministry": "finance", "metadata": {}}
        assert _is_indicator_for_minister(ind, "Finance") is True

    def test_substring_match_pm_portfolio(self):
        # indicator tagged to "Prime Minister" matches compound PM portfolio
        ind = {"ministry": "Prime Minister", "metadata": {}}
        assert (
            _is_indicator_for_minister(ind, "Prime Minister, Defence, and Industry")
            is True
        )

    def test_no_match(self):
        ind = {"ministry": "Energy", "metadata": {}}
        assert _is_indicator_for_minister(ind, "Finance") is False

    def test_shared_ministries_in_metadata(self):
        ind = {
            "ministry": "Finance",
            "metadata": {"ministries": ["Labour, Employment and Social Security"]},
        }
        assert (
            _is_indicator_for_minister(ind, "Labour, Employment and Social Security")
            is True
        )

    def test_shared_ministries_does_not_match_unrelated(self):
        ind = {
            "ministry": "Finance",
            "metadata": {"ministries": ["Labour, Employment and Social Security"]},
        }
        assert _is_indicator_for_minister(ind, "Tourism") is False

    def test_empty_ministry_no_match(self):
        ind = {"ministry": "", "metadata": {}}
        assert _is_indicator_for_minister(ind, "Finance") is False
