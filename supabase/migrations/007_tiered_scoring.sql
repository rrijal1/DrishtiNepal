-- ==============================================
-- 007: Tiered Scoring Model
-- Adds outcome_indicators, initiative_evidence tables
-- and extends scores table with 3-tier columns
-- ==============================================

-- ===========================================
-- OUTCOME INDICATORS (Tier 1)
-- Tracks real-world metrics against manifesto targets
-- ===========================================
CREATE TABLE IF NOT EXISTS outcome_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_name TEXT NOT NULL,
    indicator_label TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'economy', 'health', 'education', 'infrastructure',
        'governance', 'labor', 'foreign_policy', 'environment'
    )),
    priority_area TEXT REFERENCES manifesto_items(source_id),
    manifesto_item_id UUID REFERENCES manifesto_items(id),
    baseline_value NUMERIC,
    baseline_date DATE,
    target_value NUMERIC,
    target_deadline DATE,
    current_value NUMERIC,
    measured_date DATE,
    source TEXT NOT NULL,
    source_url TEXT,
    unit TEXT NOT NULL DEFAULT '',
    direction TEXT NOT NULL DEFAULT 'higher_is_better' CHECK (direction IN ('higher_is_better', 'lower_is_better')),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_outcome_indicators_category ON outcome_indicators(category);
CREATE INDEX IF NOT EXISTS idx_outcome_indicators_priority ON outcome_indicators(priority_area);

-- ===========================================
-- INITIATIVE EVIDENCE (Tier 3)
-- Evidence-based probability assessments for initiatives
-- ===========================================
CREATE TABLE IF NOT EXISTS initiative_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    agenda_id UUID REFERENCES governance_agendas(id),
    probability NUMERIC(3,2) CHECK (probability >= 0 AND probability <= 1),
    assessment_en TEXT,
    assessment_np TEXT,
    citations JSONB DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'under_review', 'approved', 'needs_reassessment'
    )),
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    reassessed_at TIMESTAMPTZ,
    reassessment_reason TEXT,
    reviewed_by TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_initiative_evidence_manifesto ON initiative_evidence(manifesto_item_id);
CREATE INDEX IF NOT EXISTS idx_initiative_evidence_status ON initiative_evidence(status);

-- ===========================================
-- EXTEND SCORES TABLE with tiered columns
-- ===========================================
ALTER TABLE scores
    ADD COLUMN IF NOT EXISTS outcome_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS initiative_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS evidence_score NUMERIC(5,2);

-- Add comment for methodology tracking
COMMENT ON TABLE outcome_indicators IS 'Tier 1: Real-world outcome metrics tracked against manifesto targets';
COMMENT ON TABLE initiative_evidence IS 'Tier 3: Evidence-based probability assessments for manifesto initiatives';
COMMENT ON COLUMN scores.outcome_score IS 'Tier 1: Weighted distance toward manifesto outcome targets';
COMMENT ON COLUMN scores.initiative_score IS 'Tier 2: Factual count of initiative completion';
COMMENT ON COLUMN scores.evidence_score IS 'Tier 3: Average evidence probability score';
