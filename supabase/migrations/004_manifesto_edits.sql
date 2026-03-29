-- ==============================================
-- DRISHTI NEPAL — Manifesto Community Edits
-- PR-style public editing with moderation
-- ==============================================

CREATE TABLE IF NOT EXISTS manifesto_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manifesto_item_id UUID NOT NULL REFERENCES manifesto_items(id) ON DELETE CASCADE,
    -- which field is being edited (item_text_en, item_text_np, description_en, key_commitments, etc.)
    field_name TEXT NOT NULL,
    original_text TEXT NOT NULL,
    proposed_text TEXT NOT NULL,
    reason TEXT,                        -- why this edit is being proposed
    submitter_name TEXT,
    submitter_email TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewer_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manifesto_edits_item ON manifesto_edits(manifesto_item_id);
CREATE INDEX IF NOT EXISTS idx_manifesto_edits_status ON manifesto_edits(status);
CREATE INDEX IF NOT EXISTS idx_manifesto_edits_created ON manifesto_edits(created_at DESC);

COMMENT ON TABLE manifesto_edits IS 'Community-proposed corrections to manifesto item text, reviewed by moderators before going live (PR-style workflow).';
