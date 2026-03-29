-- ==============================================
-- DRISHTI NEPAL — Combined Schema Setup
-- Paste this into Supabase Dashboard → SQL Editor
-- Combines migrations 001 + 002 + 003
-- ==============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================
-- MINISTERS
-- ===========================================
CREATE TABLE IF NOT EXISTS ministers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL UNIQUE,
    name_np TEXT NOT NULL,
    photo_url TEXT,
    portfolio_en TEXT NOT NULL,
    portfolio_np TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_ministers_status ON ministers(status);
CREATE INDEX IF NOT EXISTS idx_ministers_party ON ministers(party);

-- ===========================================
-- MANIFESTO ITEMS
-- ===========================================
CREATE TABLE IF NOT EXISTS manifesto_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT UNIQUE,
    document_type TEXT NOT NULL CHECK (document_type IN ('bachha_patra', 'karar_patra')),
    category TEXT NOT NULL,
    title_en TEXT,
    title_np TEXT,
    item_text_en TEXT NOT NULL,
    item_text_np TEXT NOT NULL,
    key_commitments JSONB DEFAULT '[]',
    measurable BOOLEAN DEFAULT FALSE,
    target_metrics JSONB,
    current_situation_en TEXT,
    current_situation_np TEXT,
    goal_en TEXT,
    goal_np TEXT,
    key_targets JSONB DEFAULT '[]',
    bachha_patra_links JSONB DEFAULT '[]',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'partially_fulfilled', 'fulfilled', 'broken', 'irrelevant')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manifesto_doc_type ON manifesto_items(document_type);
CREATE INDEX IF NOT EXISTS idx_manifesto_category ON manifesto_items(category);
CREATE INDEX IF NOT EXISTS idx_manifesto_status ON manifesto_items(status);
CREATE INDEX IF NOT EXISTS idx_manifesto_source_id ON manifesto_items(source_id);

-- Junction: manifesto → ministers
CREATE TABLE IF NOT EXISTS minister_manifesto_assignments (
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    PRIMARY KEY (minister_id, manifesto_item_id)
);

-- ===========================================
-- ACTIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    action_date DATE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    description_en TEXT,
    description_np TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'decision', 'statement', 'policy', 'legislation', 'scandal',
        'achievement', 'appointment', 'other',
        'press_conference', 'rti_response', 'parliament', 'bill',
        'committee', 'qa_session', 'announcement'
    )),
    sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    sources JSONB DEFAULT '[]',
    evidence_files TEXT[] DEFAULT '{}',
    ai_confidence_score NUMERIC(3,2) DEFAULT 0,
    human_verified BOOLEAN DEFAULT FALSE,
    published BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_minister ON actions(minister_id);
CREATE INDEX IF NOT EXISTS idx_actions_date ON actions(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_actions_category ON actions(category);
CREATE INDEX IF NOT EXISTS idx_actions_published ON actions(published);

-- Junction: actions → manifesto
CREATE TABLE IF NOT EXISTS action_manifesto_links (
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
CREATE TABLE IF NOT EXISTS cabinet_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_date DATE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    summary_en TEXT,
    summary_np TEXT,
    source_url TEXT,
    category TEXT,
    impact_assessment_en TEXT,
    impact_assessment_np TEXT,
    gazette_reference TEXT,
    significance TEXT DEFAULT 'medium' CHECK (significance IN ('critical', 'high', 'medium', 'low')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cabinet_decisions_date ON cabinet_decisions(decision_date DESC);

-- Junction: decisions → ministers
CREATE TABLE IF NOT EXISTS cabinet_decision_ministers (
    decision_id UUID REFERENCES cabinet_decisions(id) ON DELETE CASCADE,
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'responsible',
    PRIMARY KEY (decision_id, minister_id)
);

-- Junction: decisions → manifesto
CREATE TABLE IF NOT EXISTS cabinet_decision_manifesto_links (
    decision_id UUID REFERENCES cabinet_decisions(id) ON DELETE CASCADE,
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    PRIMARY KEY (decision_id, manifesto_item_id)
);

-- ===========================================
-- SCORES
-- ===========================================
CREATE TABLE IF NOT EXISTS scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    manifesto_compliance NUMERIC(5,2) DEFAULT 0,
    public_accountability NUMERIC(5,2) DEFAULT 0,
    overall NUMERIC(5,2) DEFAULT 0,
    breakdown JSONB DEFAULT '{}',
    methodology_version TEXT DEFAULT 'v2',
    scored_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scores_minister ON scores(minister_id);
CREATE INDEX IF NOT EXISTS idx_scores_date ON scores(scored_at DESC);

-- ===========================================
-- POSTS (uses content_en/content_np/category)
-- ===========================================
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN (
        'news_update', 'analysis', 'scholarly', 'cabinet_decision',
        'score_update', 'public_submission', 'agenda_update'
    )),
    slug TEXT UNIQUE NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    content_en TEXT NOT NULL,
    content_np TEXT,
    excerpt_en TEXT,
    excerpt_np TEXT,
    cover_image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    author_type TEXT DEFAULT 'agent' CHECK (author_type IN ('agent', 'editor', 'scholar', 'public')),
    author_name TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    source_url TEXT,
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

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags);

-- Junction: posts → ministers
CREATE TABLE IF NOT EXISTS post_ministers (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, minister_id)
);

-- ===========================================
-- PUBLIC SUBMISSIONS
-- ===========================================
CREATE TABLE IF NOT EXISTS public_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type TEXT NOT NULL CHECK (submission_type IN ('evidence', 'correction', 'tip')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    submitter_name TEXT,
    submitter_email TEXT,
    minister_id UUID REFERENCES ministers(id),
    action_id UUID REFERENCES actions(id),
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
    reviewer_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON public_submissions(status);

-- ===========================================
-- RAW NEWS
-- ===========================================
CREATE TABLE IF NOT EXISTS raw_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_name TEXT NOT NULL,
    source_url TEXT,
    title TEXT NOT NULL,
    title_hash TEXT UNIQUE,
    body TEXT,
    published_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    language TEXT DEFAULT 'en',
    processed BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES raw_news(id),
    processing_result JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_news_processed ON raw_news(processed);
CREATE INDEX IF NOT EXISTS idx_raw_news_title_hash ON raw_news(title_hash);
CREATE INDEX IF NOT EXISTS idx_raw_news_scraped ON raw_news(scraped_at DESC);

-- ===========================================
-- AGENT LOGS
-- ===========================================
CREATE TABLE IF NOT EXISTS agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name TEXT NOT NULL,
    run_status TEXT DEFAULT 'running' CHECK (run_status IN ('running', 'success', 'error')),
    items_processed INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_name ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_started ON agent_logs(started_at DESC);

-- ===========================================
-- GOVERNANCE AGENDAS
-- ===========================================
CREATE TABLE IF NOT EXISTS governance_agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT UNIQUE NOT NULL,
    number INTEGER NOT NULL,
    section TEXT NOT NULL,
    category TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_np TEXT,
    summary_en TEXT,
    summary_np TEXT,
    deadline TEXT,
    deadline_date DATE,
    significance TEXT DEFAULT 'medium' CHECK (significance IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'announced' CHECK (status IN (
        'announced', 'in_progress', 'completed', 'delayed', 'stalled', 'cancelled'
    )),
    manifesto_links JSONB DEFAULT '[]',
    assigned_ministry TEXT,
    evidence JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendas_section ON governance_agendas(section);
CREATE INDEX IF NOT EXISTS idx_agendas_status ON governance_agendas(status);
CREATE INDEX IF NOT EXISTS idx_agendas_category ON governance_agendas(category);
CREATE INDEX IF NOT EXISTS idx_agendas_deadline ON governance_agendas(deadline_date);
CREATE INDEX IF NOT EXISTS idx_agendas_source_id ON governance_agendas(source_id);

-- Junction: agendas → manifesto
CREATE TABLE IF NOT EXISTS agenda_manifesto_links (
    agenda_id UUID REFERENCES governance_agendas(id) ON DELETE CASCADE,
    manifesto_item_id UUID REFERENCES manifesto_items(id) ON DELETE CASCADE,
    PRIMARY KEY (agenda_id, manifesto_item_id)
);

-- Junction: agendas → ministers
CREATE TABLE IF NOT EXISTS agenda_minister_assignments (
    agenda_id UUID REFERENCES governance_agendas(id) ON DELETE CASCADE,
    minister_id UUID REFERENCES ministers(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'responsible',
    PRIMARY KEY (agenda_id, minister_id)
);

-- ===========================================
-- AUTO-UPDATE TRIGGERS
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
CREATE TRIGGER trg_ministers_updated_at BEFORE UPDATE ON ministers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TRIGGER trg_manifesto_updated_at BEFORE UPDATE ON manifesto_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TRIGGER trg_actions_updated_at BEFORE UPDATE ON actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE TRIGGER trg_agendas_updated_at BEFORE UPDATE ON governance_agendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE ministers ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifesto_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cabinet_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_agendas ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can view ministers" ON ministers FOR SELECT USING (true);
CREATE POLICY "Public can view manifesto" ON manifesto_items FOR SELECT USING (true);
CREATE POLICY "Public can view actions" ON actions FOR SELECT USING (published = true);
CREATE POLICY "Public can view decisions" ON cabinet_decisions FOR SELECT USING (true);
CREATE POLICY "Public can view scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Public can view posts" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "Public can submit" ON public_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view raw_news" ON raw_news FOR SELECT USING (true);
CREATE POLICY "Public can view agendas" ON governance_agendas FOR SELECT USING (true);

-- Service role full access (for agents)
CREATE POLICY "Service role full access ministers" ON ministers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access manifesto" ON manifesto_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access actions" ON actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access decisions" ON cabinet_decisions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access scores" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access submissions" ON public_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access raw_news" ON raw_news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access agendas" ON governance_agendas FOR ALL USING (true) WITH CHECK (true);
