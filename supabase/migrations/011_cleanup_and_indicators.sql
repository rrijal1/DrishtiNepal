-- ==============================================
-- 011: Cleanup + Indicator Measurements + Cabinet Decision Status
-- ==============================================

-- 1. Drop unused scholarly_articles table
DROP TABLE IF EXISTS scholarly_articles;

-- 2. Add implementation_status to cabinet_decisions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cabinet_decisions' AND column_name = 'implementation_status'
  ) THEN
    ALTER TABLE cabinet_decisions
      ADD COLUMN implementation_status TEXT NOT NULL DEFAULT 'not_started'
      CHECK (implementation_status IN ('not_started', 'in_progress', 'implemented', 'stalled'));
  END IF;
END $$;

-- 3. Add edited_by to posts (tracks human editor)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'edited_by'
  ) THEN
    ALTER TABLE posts ADD COLUMN edited_by TEXT;
  END IF;
END $$;

-- 4. Indicator measurements time-series
CREATE TABLE IF NOT EXISTS indicator_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator_id UUID NOT NULL REFERENCES outcome_indicators(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    measured_date DATE NOT NULL,
    source_url TEXT NOT NULL,
    source_text TEXT NOT NULL,
    entered_by TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indicator_measurements_indicator
  ON indicator_measurements(indicator_id, measured_date DESC);

-- 5. Add source_credibility to raw_news sources
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_news' AND column_name = 'credibility_tier'
  ) THEN
    ALTER TABLE raw_news
      ADD COLUMN credibility_tier SMALLINT DEFAULT 3
      CHECK (credibility_tier BETWEEN 1 AND 5);
    -- 1 = highest (verified), 2 = ekantipur/kathmandu post, 3 = setopati, 4 = other, 5 = unverified
    COMMENT ON COLUMN raw_news.credibility_tier IS '1=verified, 2=ekantipur/kathmandupost, 3=setopati, 4=other, 5=unverified';
  END IF;
END $$;
