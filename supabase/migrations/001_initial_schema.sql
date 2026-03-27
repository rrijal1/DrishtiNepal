-- Nepal Watch: Initial Database Schema
-- Run against Supabase Postgres

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- MINISTERS
-- ===========================================
CREATE TABLE ministers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_np TEXT NOT NULL,
    photo_url TEXT,
    portfolio_en TEXT NOT NULL,       -- Ministry name in English
    portfolio_np TEXT NOT NULL,       -- Ministry name in Nepali
    party TEXT NOT NULL,
    appointed_date DATE NOT NULL,
    previous_roles JSONB DEFAULT '[]',
    bio_summary_en TEXT,
    bio_summary_np TEXT,
    overall_score NUMERIC(5,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resigned', 'reshuffled', 'dismissed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ministers_status ON ministers(status);
CREATE INDEX idx_ministers_party ON ministers(party);

-- ===========================================
-- MANIFESTO ITEMS (Bachha Patra & Pratigya Patra)
-- ===========================================
CREATE TABLE manifesto_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type TEXT NOT NULL CHECK (document_type IN ('bachha_patra', 'pratigya_patra')),
    category TEXT NOT NULL,          -- economy, health, education, infrastructure, governance, etc.
    item_text_en TEXT NOT NULL,
    item_text_np TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'partially_fulfilled', 'fulfilled', 'broken', 'irrelevant')),
    embedding VECTOR(1536),          -- For semantic matching (enable pgvector extension in Supabase)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manifesto_doc_type ON manifesto_items(document_type);
CREATE INDEX idx_manifesto_category ON manifesto_items(category);
CREATE INDEX idx_manifesto_status ON manifesto_items(status);

-- Junction: manifesto items assigned to ministers
CREATE TABLE minister_manifesto_assignments (
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    PRIMARY KEY (minister_id, manifesto_item_id)
);

-- ===========================================
-- ACTIONS (Minister activities / news events)
-- ===========================================
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    action_date DATE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    description_en TEXT,
    description_np TEXT,
    category TEXT NOT NULL CHECK (category IN ('decision', 'statement', 'policy', 'legislation', 'scandal', 'achievement', 'appointment', 'other')),
    sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    sources JSONB DEFAULT '[]',          -- Array of {url, title, published_at}
    evidence_files TEXT[] DEFAULT '{}',  -- Storage paths
    ai_confidence_score NUMERIC(3,2) DEFAULT 0,
    human_verified BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actions_minister ON actions(minister_id);
CREATE INDEX idx_actions_date ON actions(action_date DESC);
CREATE INDEX idx_actions_category ON actions(category);
CREATE INDEX idx_actions_published ON actions(published);

-- Junction: actions linked to manifesto items
CREATE TABLE action_manifesto_links (
    action_id UUID REFERENCES actions(id) ON DELETE CASCADE,
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    link_type TEXT DEFAULT 'supports' CHECK (link_type IN ('supports', 'contradicts', 'partially_fulfills')),
    ai_confidence NUMERIC(3,2) DEFAULT 0,
    human_verified BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (action_id, manifesto_item_id)
);

-- ===========================================
-- CABINET DECISIONS
-- ===========================================
CREATE TABLE cabinet_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_date DATE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    summary_en TEXT,
    summary_np TEXT,
    full_text_url TEXT,
    category TEXT,
    impact_assessment_en TEXT,
    impact_assessment_np TEXT,
    gazette_reference TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cabinet_decisions_date ON cabinet_decisions(decision_date DESC);

-- Junction: cabinet decisions linked to ministers
CREATE TABLE cabinet_decision_ministers (
    decision_id UUID REFERENCES cabinet_decisions(id) ON DELETE CASCADE,
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'responsible',     -- responsible, proposer, dissenter
    PRIMARY KEY (decision_id, minister_id)
);

-- Junction: cabinet decisions linked to manifesto items
CREATE TABLE cabinet_decision_manifesto_links (
    decision_id UUID REFERENCES cabinet_decisions(id) ON DELETE CASCADE,
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    PRIMARY KEY (decision_id, manifesto_item_id)
);

-- ===========================================
-- SCORES (Historical scoring snapshots)
-- ===========================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    manifesto_compliance NUMERIC(5,2) DEFAULT 0,
    policy_effectiveness NUMERIC(5,2) DEFAULT 0,
    transparency NUMERIC(5,2) DEFAULT 0,
    financial_prudence NUMERIC(5,2) DEFAULT 0,
    public_sentiment NUMERIC(5,2) DEFAULT 0,
    parliamentary_activity NUMERIC(5,2) DEFAULT 0,
    overall NUMERIC(5,2) DEFAULT 0,
    breakdown JSONB DEFAULT '{}',        -- Detailed scoring breakdown
    methodology_version TEXT DEFAULT 'v1',
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scores_minister ON scores(minister_id);
CREATE INDEX idx_scores_date ON scores(calculated_at DESC);

-- ===========================================
-- POSTS (Published content on portal)
-- ===========================================
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('news_update', 'analysis', 'scholarly', 'cabinet_decision', 'score_update', 'public_submission')),
    slug TEXT UNIQUE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    body_en TEXT NOT NULL,
    body_np TEXT,
    excerpt_en TEXT,
    excerpt_np TEXT,
    cover_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    author_type TEXT DEFAULT 'agent' CHECK (author_type IN ('agent', 'editor', 'scholar', 'public')),
    author_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    fb_post_id TEXT,
    x_post_id TEXT,
    fb_published BOOLEAN DEFAULT FALSE,
    x_published BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- Junction: posts linked to ministers
CREATE TABLE post_ministers (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, minister_id)
);

-- ===========================================
-- PUBLIC SUBMISSIONS
-- ===========================================
CREATE TABLE public_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitter_name TEXT,
    submitter_email TEXT,
    target_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    target_minister_id UUID REFERENCES ministers(id) ON DELETE SET NULL,
    claim_text TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]',
    evidence_files TEXT[] DEFAULT '{}',
    submission_type TEXT DEFAULT 'new_info' CHECK (submission_type IN ('support', 'challenge', 'new_info', 'correction')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected', 'needs_more_info')),
    reviewer_notes TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    submitter_reputation_score NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_submissions_status ON public_submissions(status);
CREATE INDEX idx_submissions_minister ON public_submissions(target_minister_id);

-- ===========================================
-- SCHOLARLY ARTICLES
-- ===========================================
CREATE TABLE scholarly_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_np TEXT,
    author_name TEXT NOT NULL,
    author_bio TEXT,
    body_en TEXT NOT NULL,
    body_np TEXT,
    category TEXT CHECK (category IN ('policy_analysis', 'political_economy', 'governance', 'opinion', 'comparative', 'historical')),
    peer_reviewed BOOLEAN DEFAULT FALSE,
    post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- ===========================================
-- RAW NEWS (Scraped, pre-processing)
-- ===========================================
CREATE TABLE raw_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT NOT NULL,
    source_url TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    published_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processing_result JSONB,           -- AI extraction output
    duplicate_of UUID REFERENCES raw_news(id),
    title_hash TEXT,                   -- For deduplication
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_raw_news_processed ON raw_news(processed);
CREATE INDEX idx_raw_news_source ON raw_news(source_name);
CREATE INDEX idx_raw_news_scraped ON raw_news(scraped_at DESC);
CREATE INDEX idx_raw_news_title_hash ON raw_news(title_hash);

-- ===========================================
-- AGENT LOGS (For monitoring agent health)
-- ===========================================
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    run_started_at TIMESTAMPTZ DEFAULT NOW(),
    run_ended_at TIMESTAMPTZ,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'success', 'error', 'partial')),
    items_processed INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_agent_logs_name ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_status ON agent_logs(status);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE ministers ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can view ministers" ON ministers FOR SELECT USING (true);
CREATE POLICY "Public can view published posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can view scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Public can insert submissions" ON public_submissions FOR INSERT WITH CHECK (true);

-- Service role has full access (for agents)
-- Supabase service_role key bypasses RLS automatically

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ministers_updated_at BEFORE UPDATE ON ministers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_actions_updated_at BEFORE UPDATE ON actions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_manifesto_updated_at BEFORE UPDATE ON manifesto_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function: Recalculate minister overall score
CREATE OR REPLACE FUNCTION recalculate_minister_score(p_minister_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    latest_score NUMERIC;
BEGIN
    SELECT overall INTO latest_score
    FROM scores
    WHERE minister_id = p_minister_id
    ORDER BY calculated_at DESC
    LIMIT 1;

    IF latest_score IS NOT NULL THEN
        UPDATE ministers SET overall_score = latest_score WHERE id = p_minister_id;
    END IF;

    RETURN COALESCE(latest_score, 0);
END;
$$ LANGUAGE plpgsql;
