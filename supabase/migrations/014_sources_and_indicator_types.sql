-- ==============================================
-- 014: Sources table, indicator type split (result/process),
--      and process→result mapping
-- ==============================================

-- ── 1. Sources table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,          -- 'bachha_patra', 'karar_patra', '100_agendas', 'budget_2027'
    name_en TEXT NOT NULL,
    name_np TEXT,
    document_date DATE,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial sources
INSERT INTO sources (slug, name_en, name_np, document_date) VALUES
    ('bachha_patra',  'Bachha Patra (100 Foundations)', 'बच्चा पत्र (१०० आधार)', '2026-03-15'),
    ('karar_patra',   'Karar Patra (Citizens Agreement)', 'करार पत्र (नागरिक सम्झौता)', '2026-03-15'),
    ('100_agendas',   '100-Day Governance Agendas',     '१०० दिने शासकीय एजेण्डा',    '2026-03-27')
ON CONFLICT (slug) DO NOTHING;

-- RLS for sources
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view sources" ON sources;
CREATE POLICY "Public can view sources" ON sources FOR SELECT USING (true);


-- ── 2. Indicator type enum + process status enum ─────────────────────────────
DO $$ BEGIN
    CREATE TYPE indicator_type AS ENUM ('result', 'process');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE process_status AS ENUM ('not_started', 'ongoing', 'resolved', 'blocked', 'reversed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── 3. Add columns to outcome_indicators ─────────────────────────────────────
ALTER TABLE outcome_indicators
    ADD COLUMN IF NOT EXISTS indicator_type indicator_type NOT NULL DEFAULT 'result';

ALTER TABLE outcome_indicators
    ADD COLUMN IF NOT EXISTS process_status process_status DEFAULT 'not_started';

-- FK to parent result indicator (for process indicators)
ALTER TABLE outcome_indicators
    ADD COLUMN IF NOT EXISTS parent_indicator_id UUID REFERENCES outcome_indicators(id) ON DELETE SET NULL;

-- FK to source document
ALTER TABLE outcome_indicators
    ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES sources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_indicators_type ON outcome_indicators(indicator_type);
CREATE INDEX IF NOT EXISTS idx_indicators_parent ON outcome_indicators(parent_indicator_id);
CREATE INDEX IF NOT EXISTS idx_indicators_source ON outcome_indicators(source_id);


-- ── 4. Tag existing indicators with source_id (bachha_patra) ─────────────────
UPDATE outcome_indicators
SET source_id = (SELECT id FROM sources WHERE slug = 'bachha_patra')
WHERE source_id IS NULL
  AND manifesto_item_id IS NOT NULL;


-- ── 5. Remove governance_agendas and related tables ──────────────────────────
-- Drop junction tables first
DROP TABLE IF EXISTS agenda_minister_assignments CASCADE;
DROP TABLE IF EXISTS agenda_manifesto_links CASCADE;

-- Remove FK columns from gazette_entries that reference governance_agendas
ALTER TABLE gazette_entries DROP COLUMN IF EXISTS agenda_id;

-- Drop the governance_agendas table
DROP TABLE IF EXISTS governance_agendas CASCADE;


-- ── 6. Clean up: drop initiative_score / evidence_score from scores ──────────
-- These columns tracked unused tiers — keep outcome_score + overall only
ALTER TABLE scores DROP COLUMN IF EXISTS initiative_score;
ALTER TABLE scores DROP COLUMN IF EXISTS evidence_score;


-- ── 7. Comments ──────────────────────────────────────────────────────────────
COMMENT ON TABLE sources IS
    'Source documents for indicators: bachha_patra, karar_patra, budget speeches, etc.';

COMMENT ON COLUMN outcome_indicators.indicator_type IS
    'result: counts toward scores (measurable outcome). process: tracked for status only.';

COMMENT ON COLUMN outcome_indicators.process_status IS
    'Status for process indicators: not_started, ongoing, resolved, blocked, reversed.';

COMMENT ON COLUMN outcome_indicators.parent_indicator_id IS
    'For process indicators: the result indicator this process contributes to.';

COMMENT ON COLUMN outcome_indicators.source_id IS
    'Source document this indicator originates from.';
