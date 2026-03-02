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
CREATE POLICY "dm_insert" ON direct_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "dm_update" ON direct_messages FOR UPDATE USING (
  receiver_uid = auth.uid()::text
);

CREATE INDEX IF NOT EXISTS idx_dm_sender   ON direct_messages(sender_uid, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_uid, created_at DESC);

-- ─── COLUMNA is_public en user_profiles (si no existe) ───────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- ─── FIX: política INSERT en workout_sessions ────────────────
-- La política original "sessions_own" solo cubre SELECT/UPDATE/DELETE (USING).
-- Sin política de INSERT, Supabase bloquea la inserción de sesiones.
DROP POLICY IF EXISTS "sessions_own_insert" ON workout_sessions;
CREATE POLICY "sessions_own_insert" ON workout_sessions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
  );

-- También arregla la política general para que cubra SELECT/UPDATE/DELETE explícitamente
DROP POLICY IF EXISTS "sessions_own" ON workout_sessions;
CREATE POLICY "sessions_own" ON workout_sessions
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
  );
CREATE POLICY "sessions_own_update" ON workout_sessions
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
  );
CREATE POLICY "sessions_own_delete" ON workout_sessions
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text)
  );

-- ─── BODY WEIGHT ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS body_weight (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg   NUMERIC(5,2) NOT NULL,
  notes       TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE body_weight ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bw_select" ON body_weight;
DROP POLICY IF EXISTS "bw_insert" ON body_weight;
DROP POLICY IF EXISTS "bw_delete" ON body_weight;
CREATE POLICY "bw_select" ON body_weight FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));
CREATE POLICY "bw_insert" ON body_weight FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));
CREATE POLICY "bw_delete" ON body_weight FOR DELETE USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- ─── PERSONAL RECORDS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_records (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight_kg     NUMERIC(6,2) NOT NULL,
  reps          INT NOT NULL,
  notes         TEXT,
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pr_select" ON personal_records;
DROP POLICY IF EXISTS "pr_insert" ON personal_records;
DROP POLICY IF EXISTS "pr_delete" ON personal_records;
CREATE POLICY "pr_select" ON personal_records FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));
CREATE POLICY "pr_insert" ON personal_records FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));
CREATE POLICY "pr_delete" ON personal_records FOR DELETE USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- ─── PROGRESS PHOTOS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_url   TEXT NOT NULL,
  notes       TEXT,
  weight_kg   NUMERIC(5,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pp_select" ON progress_photos;
DROP POLICY IF EXISTS "pp_insert" ON progress_photos;
DROP POLICY IF EXISTS "pp_delete" ON progress_photos;
CREATE POLICY "pp_select" ON progress_photos FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));
CREATE POLICY "pp_insert" ON progress_photos FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));
CREATE POLICY "pp_delete" ON progress_photos FOR DELETE USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- ─── SEED: DEMO WORKOUT SESSIONS FOR ALL USERS ────────────────
-- Ejecuta esto en Supabase SQL Editor para generar sesiones de demo.
-- Genera ~30 sesiones por usuario repartidas en los últimos 60 días.
DO $$
DECLARE
  u           RECORD;
  rid         UUID;
  routine_ids UUID[];
  day_offset  INT;
  dur         INT;
  started     TIMESTAMPTZ;
  notes_pool  TEXT[] := ARRAY[
    'Gran sesión de hoy',
    'Me sentí muy fuerte',
    'Un poco cansado pero bien',
    'Nuevo récord personal',
    'Entrenamiento sólido',
    'Buena sesión, a por más',
    NULL, NULL, NULL
  ];
BEGIN
  -- Collect all available routine IDs
  SELECT ARRAY(SELECT id FROM routines) INTO routine_ids;

  FOR u IN SELECT id FROM users LOOP
    FOR i IN 1..30 LOOP
      -- Random day within last 60 days
      day_offset := (random() * 59)::INT;
      started    := (NOW() - (day_offset || ' days')::INTERVAL)
                    - ((random() * 16 + 6) || ' hours')::INTERVAL;
      dur        := 30 + (random() * 65)::INT;  -- 30–95 min

      -- Pick a random routine (NULL if none exist)
      IF array_length(routine_ids, 1) IS NOT NULL THEN
        rid := routine_ids[1 + (random() * (array_length(routine_ids, 1) - 1))::INT];
      ELSE
        rid := NULL;
      END IF;

      INSERT INTO workout_sessions (
        user_id, routine_id, started_at, ended_at,
        duration_minutes, rating, notes
      ) VALUES (
        u.id,
        rid,
        started,
        started + (dur || ' minutes')::INTERVAL,
        dur,
        3 + (random() * 2)::INT,
        notes_pool[1 + (random() * (array_length(notes_pool, 1) - 1))::INT]
      );
    END LOOP;
  END LOOP;
END;
$$;
