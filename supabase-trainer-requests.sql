-- ═══════════════════════════════════════════════════════════════════
--  MOVO — Fix completo entrenador↔atleta
--  Ejecutar en Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. TRIGGER: auto-crea fila en users al registrarse ──────────────────────
-- Sin esto, los usuarios que se registran con el backend caído NO tienen
-- fila en users ni supabase_id, y el buscador de entrenador falla.

CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (supabase_id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (supabase_id) DO UPDATE SET
    email     = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    role      = COALESCE(EXCLUDED.role,      public.users.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_upsert();

-- ─── 2. BACKFILL: rellena usuarios existentes ────────────────────────────────
-- Crea/actualiza la fila en public.users para TODOS los usuarios ya registrados
-- (incluyendo Jose y cualquier cliente que se registró con el backend caído)

INSERT INTO public.users (supabase_id, email, full_name, role, avatar_url)
SELECT
  id::text,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  COALESCE(raw_user_meta_data->>'role', 'user'),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (supabase_id) DO UPDATE SET
  email     = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
  role      = COALESCE(EXCLUDED.role,      public.users.role);

-- ─── 3. TABLA trainer_requests ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS trainer_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, trainer_id)
);

ALTER TABLE trainer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_requests_all" ON trainer_requests;
DROP POLICY IF EXISTS "tr_all"              ON trainer_requests;
DROP POLICY IF EXISTS "allow_all"           ON trainer_requests;

CREATE POLICY "trainer_requests_all"
  ON trainer_requests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── 4. POLÍTICAS user_routines ─────────────────────────────────────────────
-- user_routines tiene RLS activado pero sin políticas → bloquea todo.
-- Necesario para que el entrenador pueda asignar rutinas a clientes.

DROP POLICY IF EXISTS "user_routines_all" ON user_routines;
CREATE POLICY "user_routines_all"
  ON user_routines FOR ALL
  USING (true) WITH CHECK (true);

-- ─── 5. ÍNDICES ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS users_supabase_id_idx ON users (supabase_id);

