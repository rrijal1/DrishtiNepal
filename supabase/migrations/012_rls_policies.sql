-- ==============================================
-- 012: Row-Level Security for all public-schema tables
-- Fixes Supabase security advisor warning: rls_disabled_in_public
-- ==============================================
-- Strategy:
--   Public data tables  → anon can SELECT
--   Submission tables   → anon can INSERT only
--   Internal/admin tables → service role only (no anon policy = blocked)
-- The service_role key always bypasses RLS — no policies needed for it.
-- ==============================================

-- ── Ministers ────────────────────────────────────────────────────────────────
ALTER TABLE ministers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view ministers" ON ministers;
CREATE POLICY "Public can view ministers" ON ministers
  FOR SELECT USING (true);

-- ── Manifesto Items ──────────────────────────────────────────────────────────
ALTER TABLE manifesto_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view manifesto_items" ON manifesto_items;
CREATE POLICY "Public can view manifesto_items" ON manifesto_items
  FOR SELECT USING (true);

-- ── Minister ↔ Manifesto Assignments ────────────────────────────────────────
ALTER TABLE minister_manifesto_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view minister_manifesto_assignments" ON minister_manifesto_assignments;
CREATE POLICY "Public can view minister_manifesto_assignments" ON minister_manifesto_assignments
  FOR SELECT USING (true);

-- ── Actions ──────────────────────────────────────────────────────────────────
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published actions" ON actions;
CREATE POLICY "Public can view published actions" ON actions
  FOR SELECT USING (published = true);

-- ── Action ↔ Manifesto Links ─────────────────────────────────────────────────
ALTER TABLE action_manifesto_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view action_manifesto_links" ON action_manifesto_links;
CREATE POLICY "Public can view action_manifesto_links" ON action_manifesto_links
  FOR SELECT USING (true);

-- ── Cabinet Decisions ────────────────────────────────────────────────────────
ALTER TABLE cabinet_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view cabinet_decisions" ON cabinet_decisions;
CREATE POLICY "Public can view cabinet_decisions" ON cabinet_decisions
  FOR SELECT USING (true);

-- ── Cabinet Decision ↔ Ministers ────────────────────────────────────────────
ALTER TABLE cabinet_decision_ministers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view cabinet_decision_ministers" ON cabinet_decision_ministers;
CREATE POLICY "Public can view cabinet_decision_ministers" ON cabinet_decision_ministers
  FOR SELECT USING (true);

-- ── Cabinet Decision ↔ Manifesto Links ──────────────────────────────────────
ALTER TABLE cabinet_decision_manifesto_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view cabinet_decision_manifesto_links" ON cabinet_decision_manifesto_links;
CREATE POLICY "Public can view cabinet_decision_manifesto_links" ON cabinet_decision_manifesto_links
  FOR SELECT USING (true);

-- ── Scores ───────────────────────────────────────────────────────────────────
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view scores" ON scores;
CREATE POLICY "Public can view scores" ON scores
  FOR SELECT USING (true);

-- ── Posts (published only) ───────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published posts" ON posts;
CREATE POLICY "Public can view published posts" ON posts
  FOR SELECT USING (status = 'published');

-- ── Post ↔ Ministers ─────────────────────────────────────────────────────────
ALTER TABLE post_ministers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view post_ministers" ON post_ministers;
CREATE POLICY "Public can view post_ministers" ON post_ministers
  FOR SELECT USING (true);

-- ── Public Submissions (INSERT only — protects submitter PII) ───────────────
ALTER TABLE public_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can submit" ON public_submissions;
CREATE POLICY "Public can submit" ON public_submissions
  FOR INSERT WITH CHECK (true);

-- ── Agent Logs (internal — no public access) ────────────────────────────────
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT policy for anon — service_role bypasses RLS

-- ── Outcome Indicators ───────────────────────────────────────────────────────
ALTER TABLE outcome_indicators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view outcome_indicators" ON outcome_indicators;
CREATE POLICY "Public can view outcome_indicators" ON outcome_indicators
  FOR SELECT USING (true);

-- ── Initiative Evidence (approved assessments only) ──────────────────────────
ALTER TABLE initiative_evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view approved evidence" ON initiative_evidence;
CREATE POLICY "Public can view approved evidence" ON initiative_evidence
  FOR SELECT USING (status = 'approved');

-- ── Gazette Entries ──────────────────────────────────────────────────────────
ALTER TABLE gazette_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view gazette_entries" ON gazette_entries;
CREATE POLICY "Public can view gazette_entries" ON gazette_entries
  FOR SELECT USING (true);

-- ── Parliament Records ───────────────────────────────────────────────────────
ALTER TABLE parliament_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view parliament_records" ON parliament_records;
CREATE POLICY "Public can view parliament_records" ON parliament_records
  FOR SELECT USING (true);

-- ── Content Review Queue (internal — no public access) ───────────────────────
ALTER TABLE content_review_queue ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT policy for anon — service_role bypasses RLS

-- ── Manifesto Edits (public INSERT, no public SELECT — protects email) ───────
ALTER TABLE manifesto_edits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can propose edits" ON manifesto_edits;
CREATE POLICY "Public can propose edits" ON manifesto_edits
  FOR INSERT WITH CHECK (true);

-- ── Indicator Measurements ───────────────────────────────────────────────────
ALTER TABLE indicator_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view indicator_measurements" ON indicator_measurements;
CREATE POLICY "Public can view indicator_measurements" ON indicator_measurements
  FOR SELECT USING (true);

-- ── Agenda ↔ Manifesto Links ─────────────────────────────────────────────────
ALTER TABLE agenda_manifesto_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view agenda_manifesto_links" ON agenda_manifesto_links;
CREATE POLICY "Public can view agenda_manifesto_links" ON agenda_manifesto_links
  FOR SELECT USING (true);

-- ── Agenda ↔ Minister Assignments ───────────────────────────────────────────
ALTER TABLE agenda_minister_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view agenda_minister_assignments" ON agenda_minister_assignments;
CREATE POLICY "Public can view agenda_minister_assignments" ON agenda_minister_assignments
  FOR SELECT USING (true);
