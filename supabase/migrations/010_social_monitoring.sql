-- Social handles whitelist and trending topics tables
-- for the social monitoring agent

CREATE TABLE IF NOT EXISTS social_handles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform TEXT NOT NULL CHECK (platform IN ('x', 'facebook', 'rss')),
    handle TEXT NOT NULL,
    display_name TEXT,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (platform, handle)
);

CREATE TABLE IF NOT EXISTS trending_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('google_trends', 'x_trends', 'social_handle')),
    topic TEXT NOT NULL,
    topic_np TEXT,
    region TEXT DEFAULT 'NP',
    relevance_score NUMERIC(3,2),
    matched_indicators TEXT[],
    matched_manifesto_items TEXT[],
    raw_data JSONB DEFAULT '{}',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trending_topics_fetched ON trending_topics(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_topics_source ON trending_topics(source);
CREATE INDEX IF NOT EXISTS idx_social_handles_active ON social_handles(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE social_handles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view handles" ON social_handles FOR SELECT USING (true);
CREATE POLICY "Service role full access handles" ON social_handles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can view trends" ON trending_topics FOR SELECT USING (true);
CREATE POLICY "Service role full access trends" ON trending_topics FOR ALL USING (true) WITH CHECK (true);

-- Seed initial whitelisted handles
INSERT INTO social_handles (platform, handle, display_name, category) VALUES
    ('rss', 'https://kathmandupost.com/rss', 'Kathmandu Post', 'news'),
    ('rss', 'https://myrepublica.nagariknetwork.com/rss', 'Republica', 'news'),
    ('rss', 'https://thehimalayantimes.com/feed', 'Himalayan Times', 'news'),
    ('rss', 'https://english.onlinekhabar.com/feed', 'Online Khabar', 'news')
ON CONFLICT (platform, handle) DO NOTHING;
