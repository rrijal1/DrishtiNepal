-- ==============================================
-- 006: pgvector extension, embedding columns, and match RPC
-- Dimension-agnostic: works with any embedding model
-- ==============================================

-- Enable pgvector (already available on Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns (no fixed dimension — model-agnostic)
ALTER TABLE actions
    ADD COLUMN IF NOT EXISTS embedding vector;

ALTER TABLE manifesto_items
    ADD COLUMN IF NOT EXISTS embedding vector;

-- RPC function: find manifesto items similar to a query embedding
-- Uses cosine distance (<=>), returns top-N above threshold
CREATE OR REPLACE FUNCTION match_manifesto_items(
    query_embedding vector,
    match_threshold float DEFAULT 0.3,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    source_id text,
    title_en text,
    item_text_en text,
    key_commitments jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        mi.id,
        mi.source_id,
        mi.title_en,
        mi.item_text_en,
        mi.key_commitments,
        1 - (mi.embedding <=> query_embedding) AS similarity
    FROM manifesto_items mi
    WHERE mi.embedding IS NOT NULL
      AND 1 - (mi.embedding <=> query_embedding) > match_threshold
    ORDER BY mi.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
