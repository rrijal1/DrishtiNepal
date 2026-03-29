-- Add columns to the posts table for social publishing and image enrichment
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_name TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS ig_published BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS ig_post_id TEXT;

-- Add an index to help find posts needing image enrichment or IG publishing
CREATE INDEX IF NOT EXISTS posts_image_url_ig_published_idx ON public.posts (image_url, ig_published)
WHERE image_url IS NULL OR ig_published = false;
