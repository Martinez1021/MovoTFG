-- ═══════════════════════════════════════════════════════════════════════════
--  MOVO — Follow Requests Migration + Seed Data
--  Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── FOLLOW REQUESTS TABLE ───────────────────────────────────────────────────
-- Tracks pending follow requests for private accounts
CREATE TABLE IF NOT EXISTS follow_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);

ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fr_select" ON follow_requests FOR SELECT USING (true);
CREATE POLICY "fr_insert" ON follow_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "fr_update" ON follow_requests FOR UPDATE USING (true);
CREATE POLICY "fr_delete" ON follow_requests FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_fr_target    ON follow_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_fr_requester ON follow_requests(requester_id);

-- ─── FEED_POSTS: add supabase_uid index ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_feed_posts_uid ON feed_posts(supabase_uid);

-- ─── USERS: add full-text search index on full_name ──────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_fullname ON users USING gin(to_tsvector('simple', coalesce(full_name, '')));

-- ─── SEED: Fake users ────────────────────────────────────────────────────────
-- NOTE: These rows go in the PUBLIC users table. The matching auth.users entries
-- are created by running scripts/seed-users.js (needs SERVICE ROLE key).
-- The supabase_id values must match what that script outputs.
-- Run the JS script FIRST, then paste the supabase_id values here if needed.

-- ─── SEED: User profiles ─────────────────────────────────────────────────────
-- Run AFTER seed-users.js has inserted the public users rows (it does it automatically).

-- ─── SEED: Feed posts for fake users ─────────────────────────────────────────
-- These use supabase_uid TEXT field directly (no FK to auth.users required).
-- Replace the supabase_uid values after running seed-users.js.
-- seed-users.js inserts these automatically — this is a reference copy.

