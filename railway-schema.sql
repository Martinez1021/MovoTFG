-- ═══════════════════════════════════════════════════════════════════════════
--  MOVO — Railway PostgreSQL Schema + Seed Data
--  Sin políticas RLS (Railway usa credenciales directas, no Supabase Auth)
--  Ejecutar en: Railway → PostgreSQL service → Query tab
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLES ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL CHECK (role IN ('trainer', 'user')) DEFAULT 'user',
  trainer_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  supabase_id TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  weight_kg           DECIMAL(5,2),
  height_cm           INT,
  age                 INT,
  gender              TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  activity_level      TEXT CHECK (activity_level IN ('sedentary', 'beginner', 'intermediate', 'advanced')),
  goals               TEXT[] DEFAULT '{}',
  preferred_types     TEXT[] DEFAULT '{}',
  available_days      INT DEFAULT 3,
  session_duration    INT DEFAULT 45,
  notes_from_trainer  TEXT,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS routines (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL CHECK (category IN ('gym', 'yoga', 'pilates')),
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INT,
  created_by       UUID REFERENCES users(id),
  is_public        BOOLEAN DEFAULT TRUE,
  thumbnail_url    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id       UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  sets             INT,
  reps             INT,
  duration_seconds INT,
  rest_seconds     INT DEFAULT 60,
  order_index      INT NOT NULL DEFAULT 0,
  video_url        TEXT,
  image_url        TEXT,
  muscle_group     TEXT
);

CREATE TABLE IF NOT EXISTS user_routines (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id   UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  assigned_by  UUID REFERENCES users(id),
  start_date   DATE,
  end_date     DATE,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  UNIQUE(user_id, routine_id)
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id       UUID NOT NULL REFERENCES routines(id),
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  duration_minutes INT,
  calories_burned  INT,
  notes            TEXT,
  rating           INT CHECK (rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages    JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trainer_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id  UUID NOT NULL REFERENCES users(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started ON workout_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercises_routine ON exercises(routine_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_routines_user ON user_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_users_trainer ON users(trainer_id);

-- ─── SEED DATA — RUTINAS ────────────────────────────────────────────────────

INSERT INTO routines (id, title, description, category, difficulty, duration_minutes, is_public) VALUES
('11111111-0000-0000-0000-000000000001', 'Full Body Principiante', 'Rutina completa para todo el cuerpo. Perfecta para empezar a construir fuerza y hábito de entrenamiento.', 'gym', 'beginner', 45, true),
('11111111-0000-0000-0000-000000000002', 'Hipertrofia Tren Superior', 'Enfocada en pecho, espalda y bíceps para maximo volumen muscular.', 'gym', 'intermediate', 60, true),
('11111111-0000-0000-0000-000000000003', 'Lower Body Power', 'Potencia explosiva en piernas con los movimientos compuestos más efectivos.', 'gym', 'advanced', 50, true),
('22222222-0000-0000-0000-000000000001', 'Yoga Matutino 20min', 'Empieza el día con energía y claridad mental. Flujo suave para despertar el cuerpo.', 'yoga', 'beginner', 20, true),
('22222222-0000-0000-0000-000000000002', 'Yoga para Flexibilidad', 'Profundiza en posturas de apertura de cadera y espalda para mejorar tu rango de movimiento.', 'yoga', 'intermediate', 40, true),
('22222222-0000-0000-0000-000000000003', 'Yoga Restaurativo', 'Recuperación profunda. Posturas pasivas y respiración consciente para reducir el estrés.', 'yoga', 'beginner', 30, true),
('33333333-0000-0000-0000-000000000001', 'Core Pilates Básico', 'Activa y fortalece tu centro desde cero. Fundamentos del método Pilates.', 'pilates', 'beginner', 30, true),
('33333333-0000-0000-0000-000000000002', 'Pilates Reformer Style', 'Ejercicios inspirados en el reformer adaptados al suelo. Control y precisión.', 'pilates', 'intermediate', 45, true),
('33333333-0000-0000-0000-000000000003', 'Pilates Power Flow', 'Secuencia avanzada que combina fuerza, control y fluidez sin interrupciones.', 'pilates', 'advanced', 40, true)
ON CONFLICT (id) DO NOTHING;

-- ─── SEED DATA — EJERCICIOS (GYM) ───────────────────────────────────────────

INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index, muscle_group) VALUES
('11111111-0000-0000-0000-000000000001', 'Sentadilla con peso corporal', 'Pies a la anchura de hombros, baja controlado hasta 90°.', 3, 15, 60, 1, 'Cuádriceps, Glúteos'),
('11111111-0000-0000-0000-000000000001', 'Flexiones de brazos', 'Manos a la anchura de hombros.', 3, 10, 60, 2, 'Pecho, Tríceps'),
('11111111-0000-0000-0000-000000000001', 'Remo con mancuerna', 'Apóyate en un banco, tira del codo hacia el techo.', 3, 12, 60, 3, 'Dorsal, Bíceps'),
('11111111-0000-0000-0000-000000000001', 'Plancha abdominal', 'Cuerpo en línea recta de cabeza a talones.', 3, NULL, 60, 4, 'Core'),
('11111111-0000-0000-0000-000000000001', 'Zancada alternada', 'Un pie adelante, baja la rodilla trasera sin tocar el suelo.', 3, 10, 60, 5, 'Cuádriceps, Glúteos'),
('11111111-0000-0000-0000-000000000001', 'Press de hombro con mancuernas', 'Sentado o de pie, empuja hacia arriba.', 3, 12, 60, 6, 'Deltoides, Tríceps'),
('11111111-0000-0000-0000-000000000001', 'Curl de bíceps', 'Codos pegados al cuerpo, sube las mancuernas con control.', 3, 12, 60, 7, 'Bíceps'),
('11111111-0000-0000-0000-000000000002', 'Press de banca', 'Baja la barra al pecho tocando ligeramente y empuja.', 4, 8, 90, 1, 'Pecho, Tríceps, Deltoides'),
('11111111-0000-0000-0000-000000000002', 'Dominadas asistidas', 'Agarre prono, baja controlado hasta extensión completa.', 4, 6, 90, 2, 'Dorsal, Bíceps'),
('11111111-0000-0000-0000-000000000002', 'Press inclinado con mancuernas', 'Banco a 45°, lleva las mancuernas a la altura del pecho.', 3, 10, 75, 3, 'Pecho superior'),
('11111111-0000-0000-0000-000000000002', 'Remo en polea baja', 'Tira hacia el ombligo manteniendo la espalda recta.', 4, 10, 75, 4, 'Dorsal, Romboides'),
('11111111-0000-0000-0000-000000000002', 'Curl martillo', 'Codos fijos, sube con un giro neutro de muñeca.', 3, 12, 60, 5, 'Bíceps, Braquial'),
('11111111-0000-0000-0000-000000000002', 'Extensión de tríceps en polea', 'Codos pegados al cuerpo, extiende completamente.', 3, 12, 60, 6, 'Tríceps'),
('11111111-0000-0000-0000-000000000003', 'Sentadilla con barra', 'Barra en trapecios, baja hasta paralelo manteniendo la espalda neutra.', 5, 5, 120, 1, 'Cuádriceps, Glúteos, Isquios'),
('11111111-0000-0000-0000-000000000003', 'Peso muerto', 'Cadera atrás, espalda neutra, empuja el suelo con los pies.', 4, 5, 120, 2, 'Isquios, Glúteos, Lumbar'),
('11111111-0000-0000-0000-000000000003', 'Prensa de piernas', 'Pies a la anchura de hombros, baja hasta 90° sin despegar glúteos.', 4, 10, 90, 3, 'Cuádriceps, Glúteos'),
('11111111-0000-0000-0000-000000000003', 'Hip Thrust', 'Espalda en banco, empuja las caderas hacia arriba apretando glúteos.', 4, 12, 75, 4, 'Glúteos, Isquios'),
('11111111-0000-0000-0000-000000000003', 'Extensión de cuádriceps', 'Máquina, extiende completamente sin bloquear la rodilla.', 3, 15, 60, 5, 'Cuádriceps'),
('11111111-0000-0000-0000-000000000003', 'Curl femoral tumbado', 'Máquina, lleva el talón al glúteo con control.', 3, 15, 60, 6, 'Isquiotibiales'),
-- YOGA
('22222222-0000-0000-0000-000000000001', 'Postura del niño (Balasana)', 'Rodillas al suelo, alarga los brazos al frente y respira profundo.', 1, NULL, 0, 1, 'Espalda, Caderas'),
('22222222-0000-0000-0000-000000000001', 'Gato-Vaca (Marjaryasana)', 'A cuatro patas, alterna arquear y redondear la columna con la respiración.', 1, NULL, 0, 2, 'Columna, Core'),
('22222222-0000-0000-0000-000000000001', 'Perro boca abajo (Adho Mukha)', 'Forma una V invertida, presiona los talones hacia el suelo.', 1, NULL, 0, 3, 'Isquios, Hombros, Columna'),
('22222222-0000-0000-0000-000000000001', 'Guerrero I (Virabhadrasana I)', 'Pie adelante flexionado, pie trasero a 45°, brazos al cielo.', 1, NULL, 0, 4, 'Piernas, Core, Hombros'),
('22222222-0000-0000-0000-000000000001', 'Postura de la montaña (Tadasana)', 'De pie, pies juntos, cuerpo en línea, respira conscientemente.', 1, NULL, 0, 5, 'Postural, Equilibrio'),
('22222222-0000-0000-0000-000000000002', 'Paloma (Eka Pada Rajakapotasana)', 'Apertura de cadera profunda. Pierna delantera flexionada, trasera estirada.', 1, NULL, 0, 1, 'Caderas, Glúteos'),
('22222222-0000-0000-0000-000000000002', 'Lagarto (Utthan Pristhasana)', 'Estocada baja con el codo bajando al suelo para máxima apertura.', 1, NULL, 0, 2, 'Flexores de cadera, Cuádriceps'),
('22222222-0000-0000-0000-000000000002', 'Pinza de pie (Uttanasana)', 'Desde de pie, dobla hacia delante con las piernas estiradas.', 1, NULL, 0, 3, 'Isquios, Gemelos, Columna'),
('22222222-0000-0000-0000-000000000002', 'Torsión sentada (Ardha Matsyendrasana)', 'Sentado, cruza una pierna y gira el tronco mirando atrás.', 1, NULL, 0, 4, 'Columna, Oblicuos, Caderas'),
('22222222-0000-0000-0000-000000000003', 'Savasana activo', 'Tumbado boca arriba, escaneo corporal de pies a cabeza.', 1, NULL, 0, 1, 'Recuperación'),
('22222222-0000-0000-0000-000000000003', 'Piernas en la pared (Viparita Karani)', 'Glúteos cerca de la pared, piernas verticales. Relajación venosa.', 1, NULL, 0, 2, 'Circulación, Recuperación'),
('22222222-0000-0000-0000-000000000003', 'Respiración 4-7-8', 'Inhala 4 segundos, retén 7, exhala 8. Activa el nervio vago.', 1, NULL, 0, 3, 'Sistema nervioso'),
-- PILATES
('33333333-0000-0000-0000-000000000001', 'The Hundred', 'Piernas a 45°, bombea los brazos 100 veces respirando en 5 y fuera en 5.', 1, NULL, 30, 1, 'Core, Resistencia'),
('33333333-0000-0000-0000-000000000001', 'Roll Up', 'Desde tumbado, sube vertebra a vertebra hasta tocar los pies.', 3, 8, 30, 2, 'Abdominal, Columna'),
('33333333-0000-0000-0000-000000000001', 'Leg Circle', 'Tumbado, traza círculos con una pierna manteniendo la cadera estable.', 3, 8, 30, 3, 'Caderas, Core'),
('33333333-0000-0000-0000-000000000001', 'Single Leg Stretch', 'Alterna llevar cada rodilla al pecho mientras estiras la contraria.', 3, 10, 30, 4, 'Abdominal, Coordinación'),
('33333333-0000-0000-0000-000000000002', 'Swan Dive', 'Boca abajo, arquea la espalda levantando el pecho con control.', 3, 8, 45, 1, 'Lumbar, Glúteos'),
('33333333-0000-0000-0000-000000000002', 'Side Kick Series', 'Tumbado de lado, lanza la pierna al frente y atrás manteniendo el core activo.', 3, 10, 45, 2, 'Abductores, Glúteos'),
('33333333-0000-0000-0000-000000000002', 'Teaser', 'El ejercicio más icónico del Pilates: sube piernas y torso en V simultáneamente.', 3, 6, 45, 3, 'Core completo'),
('33333333-0000-0000-0000-000000000003', 'Control Balance', 'Desde inversión, alterna bajar cada pierna manteniendo el equilibrio.', 3, 5, 60, 1, 'Core, Columna, Equilibrio'),
('33333333-0000-0000-0000-000000000003', 'Boomerang', 'Combinación de Teaser y Roll Over. Máximo control de la columna.', 3, 5, 60, 2, 'Core completo'),
('33333333-0000-0000-0000-000000000003', 'Push Up Pilates', 'Desde pie: dobla hacia el suelo, camina con manos, flexión, vuelta.', 3, 8, 60, 3, 'Pecho, Core, Hombros')
ON CONFLICT DO NOTHING;
