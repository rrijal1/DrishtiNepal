-- ==============================================
-- 008: Phase 2 — Coverage Completeness
-- Adds gazette_entries, parliament_records,
-- and content_review_queue tables
-- ==============================================

-- ===========================================
-- GAZETTE ENTRIES
-- Official government gazette notifications
-- Source: rajpatra.dop.gov.np + manual entry
-- ===========================================
CREATE TABLE IF NOT EXISTS gazette_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gazette_number TEXT,
    published_date DATE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    summary_en TEXT,
    summary_np TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'law', 'regulation', 'appointment', 'policy',
        'budget', 'notification', 'ordinance', 'general'
    )),
    source_url TEXT,
    pdf_url TEXT,
    full_text TEXT,
    significance TEXT DEFAULT 'medium' CHECK (significance IN ('critical', 'high', 'medium', 'low')),
    manifesto_item_id UUID REFERENCES manifesto_items(id),
    agenda_id UUID REFERENCES governance_agendas(id),
    ai_summary TEXT,
    review_status TEXT DEFAULT 'auto_published' CHECK (review_status IN (
        'auto_published', 'needs_review', 'reviewed', 'flagged'
    )),
    reviewed_by TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gazette_published ON gazette_entries(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_gazette_category ON gazette_entries(category);
CREATE INDEX IF NOT EXISTS idx_gazette_review ON gazette_entries(review_status);

-- ===========================================
-- PARLIAMENT RECORDS
-- Bills, committee reports, Q&A, votes
-- Source: hr.parliament.gov.np, na.parliament.gov.np
-- ===========================================
CREATE TABLE IF NOT EXISTS parliament_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type TEXT NOT NULL CHECK (record_type IN (
        'bill', 'committee_report', 'question_answer',
        'vote', 'resolution', 'speech', 'notice'
    )),
    chamber TEXT NOT NULL DEFAULT 'house' CHECK (chamber IN ('house', 'national_assembly', 'joint')),
    session_number TEXT,
    record_date DATE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    summary_en TEXT,
    summary_np TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'recorded' CHECK (status IN (
        'introduced', 'in_committee', 'passed', 'rejected',
        'withdrawn', 'recorded', 'pending'
    )),
    related_minister_id UUID REFERENCES ministers(id),
    manifesto_item_id UUID REFERENCES manifesto_items(id),
    ai_summary TEXT,
    review_status TEXT DEFAULT 'auto_published' CHECK (review_status IN (
        'auto_published', 'needs_review', 'reviewed', 'flagged'
    )),
    reviewed_by TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parliament_date ON parliament_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_parliament_type ON parliament_records(record_type);
CREATE INDEX IF NOT EXISTS idx_parliament_chamber ON parliament_records(chamber);
CREATE INDEX IF NOT EXISTS idx_parliament_review ON parliament_records(review_status);

-- ===========================================
-- CONTENT REVIEW QUEUE
-- Unified moderation queue for all content types
-- Used by the moderator dashboard
-- ===========================================
CREATE TABLE IF NOT EXISTS content_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN (
        'gazette_entry', 'parliament_record', 'evidence_assessment',
        'action', 'post', 'manifesto_edit', 'public_submission', 'score_update'
    )),
    content_id UUID NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_review', 'approved', 'rejected', 'needs_revision'
    )),
    title TEXT NOT NULL,
    summary TEXT,
    ai_confidence NUMERIC(3,2),
    flagged_reason TEXT,
    assigned_to TEXT,
    reviewed_by TEXT,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_review_queue_status ON content_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_priority ON content_review_queue(priority);
CREATE INDEX IF NOT EXISTS idx_review_queue_type ON content_review_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_review_queue_created ON content_review_queue(created_at DESC);

-- Add review_status column to existing initiative_evidence table
ALTER TABLE initiative_evidence
    ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'needs_review' CHECK (review_status IN (
        'auto_published', 'needs_review', 'reviewed', 'flagged'
    ));

-- Add gazette_entry_id to cabinet_decisions for cross-referencing
ALTER TABLE cabinet_decisions
    ADD COLUMN IF NOT EXISTS gazette_entry_id UUID REFERENCES gazette_entries(id);
