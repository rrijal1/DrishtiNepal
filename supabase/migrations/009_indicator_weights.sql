-- ==============================================
-- 009: Outcome Indicator Weights & Ministry Attribution
--
-- Adds per-indicator weight (1-100 integer) and ministry attribution
-- to outcome_indicators. Also adds UNIQUE constraint on indicator_name
-- so upserts work deterministically.
--
-- Methodology v1: Score = weighted average of indicator progress.
--   progress_i = (current - baseline) / (target - baseline)
--   minister_score = Σ(weight_i × progress_i) / Σ(weight_i) × 100
--
-- weight scale: 1 (minor metric) → 10 (core manifesto target)
-- ministry: exact portfolio string from cabinet_2026.json
--   Shared responsibility stored in metadata.ministries []
-- ==============================================

-- Weight for each indicator (1-100, community-agreed)
ALTER TABLE outcome_indicators
    ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 5
        CHECK (weight > 0 AND weight <= 100);

-- Primary responsible ministry portfolio (exact string from cabinet)
ALTER TABLE outcome_indicators
    ADD COLUMN IF NOT EXISTS ministry TEXT NOT NULL DEFAULT '';

-- Ensure we can upsert by indicator_name reliably
ALTER TABLE outcome_indicators
    DROP CONSTRAINT IF EXISTS outcome_indicators_indicator_name_key;

ALTER TABLE outcome_indicators
    ADD CONSTRAINT outcome_indicators_indicator_name_key UNIQUE (indicator_name);

-- Drop methodology version comment (now v1)
COMMENT ON TABLE outcome_indicators IS
    'Outcome indicators: real-world metrics tracked against manifesto targets.
     Score = weighted average of indicator progress toward each target.
     weight (1-100): indicator importance (community-agreed).
     ministry: primary responsible portfolio for minister attribution.
     metadata.ministries []: additional shared portfolios.';

COMMENT ON COLUMN outcome_indicators.weight IS
    'Indicator weight (1-100 scale, community-agreed). Core manifesto targets get higher weights.';

COMMENT ON COLUMN outcome_indicators.ministry IS
    'Primary responsible ministry portfolio string (must match portfolio_en in ministers table).
     For indicators shared across portfolios, use metadata.ministries for additional assignments.';
