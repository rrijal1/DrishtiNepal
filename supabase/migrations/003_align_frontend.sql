-- Migration 003: Align schema column names with frontend expectations
-- The frontend code uses content_en/content_np/category instead of body_en/body_np/type,
-- and expects ai_generated, source_url, significance columns to exist.

-- ===========================================
-- 1. POSTS — rename columns + add new ones
-- ===========================================

-- Rename body → content (matches frontend field names)
ALTER TABLE posts RENAME COLUMN body_en TO content_en;
ALTER TABLE posts RENAME COLUMN body_np TO content_np;

-- Rename type → category (avoids reserved-word confusion, matches frontend)
ALTER TABLE posts RENAME COLUMN type TO category;

-- Drop old constraint (references old column name)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;
ALTER TABLE posts ADD CONSTRAINT posts_category_check
    CHECK (category IN (
        'news_update', 'analysis', 'scholarly', 'cabinet_decision',
        'score_update', 'public_submission', 'agenda_update'
    ));

-- Add flag for AI-generated content
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

-- Source attribution URL
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_url TEXT;

-- ===========================================
-- 2. CABINET DECISIONS — rename + add columns
-- ===========================================

-- Frontend uses source_url instead of full_text_url
ALTER TABLE cabinet_decisions RENAME COLUMN full_text_url TO source_url;

-- Significance level for visual badges
ALTER TABLE cabinet_decisions ADD COLUMN IF NOT EXISTS significance TEXT
    DEFAULT 'medium'
    CHECK (significance IN ('critical', 'high', 'medium', 'low'));

-- ===========================================
-- 3. SCORES — rename timestamp column
-- ===========================================

-- Frontend queries scored_at, schema has calculated_at
ALTER TABLE scores RENAME COLUMN calculated_at TO scored_at;

-- Fix the index on the renamed column
DROP INDEX IF EXISTS idx_scores_date;
CREATE INDEX idx_scores_date ON scores(scored_at DESC);

-- ===========================================
-- 4. RAW NEWS — create if not exists
-- ===========================================
-- The content generator expects a raw_news table for the scraping pipeline.
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

ALTER TABLE raw_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view raw_news" ON raw_news FOR SELECT USING (true);

-- ===========================================
-- 5. AGENT LOGS — create if not exists
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
