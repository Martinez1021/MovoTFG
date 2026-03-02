-- ═══════════════════════════════════════════════════════════════
--  MOVO — Migración: follow_requests + direct_messages
--  Ejecutar SOLO esto en Supabase SQL Editor (no el schema completo)
-- ═══════════════════════════════════════════════════════════════

-- ─── FOLLOW REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follow_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);

ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follow_req_select" ON follow_requests;
DROP POLICY IF EXISTS "follow_req_insert" ON follow_requests;
DROP POLICY IF EXISTS "follow_req_update" ON follow_requests;
DROP POLICY IF EXISTS "follow_req_delete" ON follow_requests;

CREATE POLICY "follow_req_select" ON follow_requests FOR SELECT USING (true);
CREATE POLICY "follow_req_insert" ON follow_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "follow_req_update" ON follow_requests FOR UPDATE USING (true);
CREATE POLICY "follow_req_delete" ON follow_requests FOR DELETE USING (true);

-- ─── DIRECT MESSAGES ─────────────────────────────────────────
-- sender_uid / receiver_uid = supabase auth UID (TEXT)
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_uid   TEXT NOT NULL,
  receiver_uid TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dm_select" ON direct_messages;
DROP POLICY IF EXISTS "dm_insert" ON direct_messages;
DROP POLICY IF EXISTS "dm_update" ON direct_messages;

CREATE POLICY "dm_select" ON direct_messages FOR SELECT USING (
  sender_uid = auth.uid()::text OR receiver_uid = auth.uid()::text
);
CREATE POLICY "dm_insert" ON direct_messages FOR INSERT WITH CHECK (
  sender_uid = auth.uid()::text
);
CREATE POLICY "dm_update" ON direct_messages FOR UPDATE USING (
  receiver_uid = auth.uid()::text
);

CREATE INDEX IF NOT EXISTS idx_dm_sender   ON direct_messages(sender_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_uid, created_at DESC);

-- ─── COLUMNA is_public en user_profiles (si no existe) ───────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
