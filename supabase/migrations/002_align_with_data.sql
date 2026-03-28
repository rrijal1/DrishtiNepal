-- Migration 002: Align schema with actual structured data
-- Addresses gaps found when auditing bachha_patra.json, karar_patra.json,
-- 100_agendas.json, and cabinet_2026.json against 001_initial_schema.sql.

-- ===========================================
-- 1. MANIFESTO ITEMS — add structured fields
-- ===========================================

-- Stable ID from JSON (bp-001, pp-001, etc.) for cross-referencing
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS source_id TEXT UNIQUE;

-- Title separate from item_text (item_text stays as the full description/summary)
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS title_np TEXT;

-- Structured commitments and targets from bachha patra
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS key_commitments JSONB DEFAULT '[]';
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS measurable BOOLEAN DEFAULT FALSE;
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS target_metrics JSONB;

-- Karar patra specific: current situation, goal, and links back to bachha patra
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS current_situation_en TEXT;
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS current_situation_np TEXT;
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS goal_en TEXT;
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS goal_np TEXT;
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS key_targets JSONB DEFAULT '[]';
ALTER TABLE manifesto_items ADD COLUMN IF NOT EXISTS bachha_patra_links JSONB DEFAULT '[]';

-- Expand priority CHECK to include 'critical' (used in bachha_patra.json)
ALTER TABLE manifesto_items DROP CONSTRAINT IF EXISTS manifesto_items_priority_check;
ALTER TABLE manifesto_items ADD CONSTRAINT manifesto_items_priority_check
    CHECK (priority IN ('critical', 'high', 'medium', 'low'));

CREATE INDEX IF NOT EXISTS idx_manifesto_source_id ON manifesto_items(source_id);

-- ===========================================
-- 2. GOVERNANCE AGENDAS — new table
-- ===========================================

CREATE TABLE IF NOT EXISTS governance_agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT UNIQUE NOT NULL,        -- ga-001 through ga-100
    number INTEGER NOT NULL,
    section TEXT NOT NULL,                  -- A through L
    category TEXT NOT NULL,                -- governance, economy, infrastructure, etc.
    title_en TEXT NOT NULL,
    title_np TEXT,
    summary_en TEXT,
    summary_np TEXT,
    deadline TEXT,                          -- Raw deadline text: "7 days", "30 days", etc.
    deadline_date DATE,                    -- Computed absolute deadline from decision_date
    significance TEXT DEFAULT 'medium' CHECK (significance IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'announced' CHECK (status IN (
        'announced', 'in_progress', 'completed', 'delayed', 'stalled', 'cancelled'
    )),
    manifesto_links JSONB DEFAULT '[]',    -- Array of bp-XXX IDs
    assigned_ministry TEXT,                -- Ministry responsible (free text for now)
    evidence JSONB DEFAULT '[]',           -- Supporting evidence / news links
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agendas_section ON governance_agendas(section);
CREATE INDEX idx_agendas_status ON governance_agendas(status);
CREATE INDEX idx_agendas_category ON governance_agendas(category);
CREATE INDEX idx_agendas_deadline ON governance_agendas(deadline_date);
CREATE INDEX idx_agendas_source_id ON governance_agendas(source_id);

-- Junction: agendas to manifesto items (for DB-level FK tracking)
CREATE TABLE IF NOT EXISTS agenda_manifesto_links (
    agenda_id UUID REFERENCES governance_agendas(id) ON DELETE CASCADE,
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    PRIMARY KEY (agenda_id, manifesto_item_id)
);

-- Junction: agendas assigned to ministers
CREATE TABLE IF NOT EXISTS agenda_minister_assignments (
    agenda_id UUID REFERENCES governance_agendas(id) ON DELETE CASCADE,
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'responsible',
    PRIMARY KEY (agenda_id, minister_id)
);

-- Auto-update trigger
CREATE TRIGGER trg_agendas_updated_at BEFORE UPDATE ON governance_agendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE governance_agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view agendas" ON governance_agendas FOR SELECT USING (true);

-- ===========================================
-- 3. ACTIONS — expand category values
-- ===========================================
-- The scoring agent needs press_conference, rti_response, parliament, bill,
-- committee, qa_session, and legislative. Add these to the CHECK constraint.

ALTER TABLE actions DROP CONSTRAINT IF EXISTS actions_category_check;
ALTER TABLE actions ADD CONSTRAINT actions_category_check
    CHECK (category IN (
        'decision', 'statement', 'policy', 'legislation', 'scandal',
        'achievement', 'appointment', 'other',
        -- New categories for richer scoring
        'press_conference', 'rti_response', 'parliament', 'bill',
        'committee', 'qa_session', 'announcement'
    ));

-- ===========================================
-- 4. POSTS — add 'agenda_update' type
-- ===========================================
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE posts ADD CONSTRAINT posts_type_check
    CHECK (type IN (
        'news_update', 'analysis', 'scholarly', 'cabinet_decision',
        'score_update', 'public_submission', 'agenda_update'
    ));
