-- ═══════════════════════════════════════════════════════════════════
--  MOVO — trainer_requests table + RLS
--  Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trainer_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, trainer_id)
);

-- Enable RLS
ALTER TABLE trainer_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "trainer_requests_all" ON trainer_requests;
DROP POLICY IF EXISTS "tr_all"              ON trainer_requests;
DROP POLICY IF EXISTS "allow_all"           ON trainer_requests;

-- Allow full access (app-level logic controls permissions)
CREATE POLICY "trainer_requests_all"
  ON trainer_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also make sure the users table has supabase_id indexed for fast lookup
CREATE INDEX IF NOT EXISTS users_supabase_id_idx ON users (supabase_id);
