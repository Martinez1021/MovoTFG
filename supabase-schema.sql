-- ═══════════════════════════════════════════════════════════════════════════
--  MOVO — Supabase PostgreSQL Schema + Seed Data
--  Run this entire file in Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
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

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_messages ENABLE ROW LEVEL SECURITY;

-- users: anyone can read; write only own row
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid()::text = supabase_id);

-- user_profiles: own profile only
CREATE POLICY "profiles_own" ON user_profiles USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- routines: public ones visible to all
CREATE POLICY "routines_public" ON routines FOR SELECT USING (is_public = true);
CREATE POLICY "routines_own" ON routines FOR ALL USING (created_by IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- sessions: own only
CREATE POLICY "sessions_own" ON workout_sessions USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- ai_conversations: own only
CREATE POLICY "ai_own" ON ai_conversations USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

-- Insert routines (is_public = true, no created_by for system routines)
INSERT INTO routines (id, title, description, category, difficulty, duration_minutes, is_public) VALUES
-- GYM
('11111111-0000-0000-0000-000000000001', 'Full Body Principiante', 'Rutina completa para todo el cuerpo. Perfecta para empezar a construir fuerza y hábito de entrenamiento.', 'gym', 'beginner', 45, true),
('11111111-0000-0000-0000-000000000002', 'Hipertrofia Tren Superior', 'Enfocada en pecho, espalda y bíceps para maximo volumen muscular.', 'gym', 'intermediate', 60, true),
('11111111-0000-0000-0000-000000000003', 'Lower Body Power', 'Potencia explosiva en piernas con los movimientos compuestos más efectivos.', 'gym', 'advanced', 50, true),
-- YOGA
('22222222-0000-0000-0000-000000000001', 'Yoga Matutino 20min', 'Empieza el día con energía y claridad mental. Flujo suave para despertar el cuerpo.', 'yoga', 'beginner', 20, true),
('22222222-0000-0000-0000-000000000002', 'Yoga para Flexibilidad', 'Profundiza en posturas de apertura de cadera y espalda para mejorar tu rango de movimiento.', 'yoga', 'intermediate', 40, true),
('22222222-0000-0000-0000-000000000003', 'Yoga Restaurativo', 'Recuperación profunda. Posturas pasivas y respiración consciente para reducir el estrés.', 'yoga', 'beginner', 30, true),
-- PILATES
('33333333-0000-0000-0000-000000000001', 'Core Pilates Básico', 'Activa y fortalece tu centro desde cero. Fundamentos del método Pilates.', 'pilates', 'beginner', 30, true),
('33333333-0000-0000-0000-000000000002', 'Pilates Reformer Style', 'Ejercicios inspirados en el reformer adaptados al suelo. Control y precisión.', 'pilates', 'intermediate', 45, true),
('33333333-0000-0000-0000-000000000003', 'Pilates Power Flow', 'Secuencia avanzada que combina fuerza, control y fluidez sin interrupciones.', 'pilates', 'advanced', 40, true);

-- ── GYM EXERCISES ──────────────────────────────────────────────────────────

-- Full Body Principiante
INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index, muscle_group) VALUES
('11111111-0000-0000-0000-000000000001', 'Sentadilla con peso corporal', 'Pies a la anchura de hombros, baja controlado hasta 90° manteniendo el pecho arriba.', 3, 15, 60, 1, 'Cuádriceps, Glúteos'),
('11111111-0000-0000-0000-000000000001', 'Flexiones de brazos', 'Manos a la anchura de hombros. Si no puedes completas, hazlas con rodillas.', 3, 10, 60, 2, 'Pecho, Tríceps'),
('11111111-0000-0000-0000-000000000001', 'Remo con mancuerna', 'Apóyate en un banco, tira del codo hacia el techo manteniendo la espalda plana.', 3, 12, 60, 3, 'Dorsal, Bíceps'),
('11111111-0000-0000-0000-000000000001', 'Plancha abdominal', 'Cuerpo en línea recta de cabeza a talones. Activa glúteos y abdominales.', 3, NULL, 60, 4, 'Core'),
('11111111-0000-0000-0000-000000000001', 'Zancada alternada', 'Un pie adelante, baja la rodilla trasera sin tocar el suelo. Alterna piernas.', 3, 10, 60, 5, 'Cuádriceps, Glúteos'),
('11111111-0000-0000-0000-000000000001', 'Press de hombro con mancuernas', 'Sentado o de pie, empuja hacia arriba sin bloquear los codos.', 3, 12, 60, 6, 'Deltoides, Tríceps'),
('11111111-0000-0000-0000-000000000001', 'Curl de bíceps', 'Codos pegados al cuerpo, sube las mancuernas con control.', 3, 12, 60, 7, 'Bíceps'),
('11111111-0000-0000-0000-000000000001', 'Extensión de tríceps en polea', 'Agarra la cuerda por encima de la cabeza, baja controlando el movimiento.', 3, 12, 60, 8, 'Tríceps');

-- Hipertrofia Tren Superior
INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index, muscle_group) VALUES
('11111111-0000-0000-0000-000000000002', 'Press banca con barra', 'Agarre ligeramente más ancho que los hombros. Baja la barra al pecho y empuja.', 4, 8, 90, 1, 'Pecho'),
('11111111-0000-0000-0000-000000000002', 'Aperturas con mancuernas en banco plano', 'Arco ligero en los codos, abre hasta sentir el estiramiento del pecho.', 4, 12, 75, 2, 'Pecho'),
('11111111-0000-0000-0000-000000000002', 'Press inclinado con mancuernas', 'Banco a 30-45°. Enfoca el trabajo en la parte superior del pecho.', 3, 10, 75, 3, 'Pecho superior'),
('11111111-0000-0000-0000-000000000002', 'Dominadas agarre prono', 'Agarre por encima, más ancho que los hombros. Si no puedes, usa banda de asistencia.', 4, 6, 90, 4, 'Dorsal'),
('11111111-0000-0000-0000-000000000002', 'Remo en polea baja sentado', 'Tira hacia el ombligo, retrae los omóplatos al final del movimiento.', 4, 10, 75, 5, 'Dorsal, Bíceps'),
('11111111-0000-0000-0000-000000000002', 'Curl predicador con barra EZ', 'Apoya los tríceps en el predicador, movimiento completo sin inercia.', 3, 10, 60, 6, 'Bíceps'),
('11111111-0000-0000-0000-000000000002', 'Press francés con barra EZ', 'Tumbado, baja la barra hacia la frente controlando con los tríceps.', 3, 10, 60, 7, 'Tríceps'),
('11111111-0000-0000-0000-000000000002', 'Elevaciones laterales', 'Mancuernas bajas, sube hasta la altura del hombro con leve flexión de codo.', 3, 15, 45, 8, 'Deltoides lateral');

-- Lower Body Power
INSERT INTO exercises (routine_id, name, description, sets, reps, rest_seconds, order_index, muscle_group) VALUES
('11111111-0000-0000-0000-000000000003', 'Sentadilla búlgara', 'Pie trasero elevado en banco. Profundidad máxima manteniendo la espalda vertical.', 4, 8, 120, 1, 'Cuádriceps, Glúteos'),
('11111111-0000-0000-0000-000000000003', 'Peso muerto rumano', 'Rodillas ligeramente flexionadas, baja con la barra pegada a las piernas.', 4, 8, 120, 2, 'Isquiotibiales, Glúteos'),
('11111111-0000-0000-0000-000000000003', 'Hip Thrust con barra', 'Espalda en banco, barra en cadera. Empuja con los glúteos hasta extensión completa.', 4, 10, 90, 3, 'Glúteos'),
('11111111-0000-0000-0000-000000000003', 'Prensa de piernas 45°', 'Pies altos en la plataforma para enfatizar los glúteos e isquios.', 3, 12, 90, 4, 'Cuádriceps, Glúteos'),
('11111111-0000-0000-0000-000000000003', 'Extensión de cuádriceps', 'Movimiento aislado, aprieta en la parte alta del recorrido.', 3, 15, 60, 5, 'Cuádriceps'),
('11111111-0000-0000-0000-000000000003', 'Curl de isquiotibiales tumbado', 'Lleva los talones hacia los glúteos sin levantar las caderas.', 3, 12, 60, 6, 'Isquiotibiales'),
('11111111-0000-0000-0000-000000000003', 'Elevación de pantorrillas de pie', 'Un escalón para mayor rango. Sube lento, baja despacio.', 4, 20, 45, 7, 'Gemelos'),
('11111111-0000-0000-0000-000000000003', 'Sentadilla sumo con mancuerna', 'Pies muy abiertos, punta hacia afuera. Enfoca el trabajo en aductores e isquios.', 3, 12, 75, 8, 'Aductores, Glúteos');

-- ── YOGA EXERCISES ─────────────────────────────────────────────────────────

-- Yoga Matutino 20min
INSERT INTO exercises (routine_id, name, description, duration_seconds, rest_seconds, order_index, muscle_group) VALUES
('22222222-0000-0000-0000-000000000001', 'Saludo al Sol A (×3)', 'Flujo dinámico: de pie → doblar → plancha → cobra → perro boca abajo → de pie. Sincroniza con la respiración.', 180, 30, 1, 'Cuerpo completo'),
('22222222-0000-0000-0000-000000000001', 'Postura del Gato-Vaca', 'En cuadrupedia, alterna arco y extensión de columna. Inhala en vaca, exhala en gato.', 60, 15, 2, 'Columna vertebral'),
('22222222-0000-0000-0000-000000000001', 'Guerrero I (cada lado)', 'Pie adelante, rodilla a 90°, brazos arriba. Abre la cadera hacia el frente.', 60, 15, 3, 'Cuádriceps, Cadera'),
('22222222-0000-0000-0000-000000000001', 'Perro mirando hacia arriba', 'Tumbado, empuja el pecho arriba con los brazos extendidos. Abre el pecho.', 45, 15, 4, 'Pecho, Columna'),
('22222222-0000-0000-0000-000000000001', 'Torsión sentado', 'Sentado, gira el torso llevando el brazo al lado contrario de la rodilla doblada.', 60, 15, 5, 'Columna, Oblicuos'),
('22222222-0000-0000-0000-000000000001', 'Postura del Niño', 'Rodillas abiertas, frente al suelo, brazos extendidos. Respira profundo.', 90, 0, 6, 'Espalda baja, Cadera'),
('22222222-0000-0000-0000-000000000001', 'Savasana', 'Tumbado boca arriba, relajación completa. Escanea el cuerpo mentalmente.', 120, 0, 7, 'Relajación');

-- Yoga para Flexibilidad
INSERT INTO exercises (routine_id, name, description, duration_seconds, rest_seconds, order_index, muscle_group) VALUES
('22222222-0000-0000-0000-000000000002', 'Postura de la Paloma (cada lado)', 'Pierna delantera doblada en ángulo, pierna trasera extendida. Abre profundamente la cadera.', 120, 30, 1, 'Cadera, Glúteos'),
('22222222-0000-0000-0000-000000000002', 'Cobra profunda', 'Manos bajo los hombros, levanta el pecho. Lleva la mirada hacia arriba.', 60, 20, 2, 'Columna, Pecho'),
('22222222-0000-0000-0000-000000000002', 'Postura del Arco', 'Boca abajo, agarra los tobillos. Levanta el pecho y las piernas simultáneamente.', 60, 30, 3, 'Columna, Cuádriceps, Pecho'),
('22222222-0000-0000-0000-000000000002', 'Triángulo extendido (cada lado)', 'Piernas abiertas, un brazo al suelo, otro al techo. Abre el pecho.', 90, 20, 4, 'Isquiotibiales, Cadera'),
('22222222-0000-0000-0000-000000000002', 'Mariposa sentada', 'Plantas de los pies juntas, rodillas hacia el suelo. Inclinate hacia adelante.', 120, 15, 5, 'Aductores, Cadera'),
('22222222-0000-0000-0000-000000000002', 'Perro boca abajo con tobillos en pulsación', 'Desde perro boca abajo, alterna el talón al suelo. Profundiza en gemelos e isquios.', 90, 15, 6, 'Isquiotibiales, Gemelos'),
('22222222-0000-0000-0000-000000000002', 'Salamba Sarvangasana (vela)', 'Hombros en el suelo, caderas arriba apoyadas por las manos. Solo si hay experiencia previa.', 60, 30, 7, 'Columna, Core'),
('22222222-0000-0000-0000-000000000002', 'Paschimottanasana', 'Piernas extendidas al frente, alcanza los pies. Mantén la columna larga.', 120, 0, 8, 'Isquiotibiales, Espalda baja');

-- Yoga Restaurativo
INSERT INTO exercises (routine_id, name, description, duration_seconds, rest_seconds, order_index, muscle_group) VALUES
('22222222-0000-0000-0000-000000000003', 'Respiración 4-7-8', 'Inhala 4s, retén 7s, exhala 8s. Activa el sistema nervioso parasimpático.', 180, 30, 1, 'Sistema nervioso'),
('22222222-0000-0000-0000-000000000003', 'Postura de piernas en la pared', 'Tumbado, piernas apoyadas verticalmente en la pared. Restaura la circulación.', 300, 30, 2, 'Circulación'),
('22222222-0000-0000-0000-000000000003', 'Torsión supina (cada lado)', 'Tumbado, lleva una rodilla al lado contrario. Abre el pecho hacia el techo.', 120, 20, 3, 'Columna, Cadera'),
('22222222-0000-0000-0000-000000000003', 'Postura del Niño sostenida', 'Frente al suelo, brazos al frente o al lado. Respira expansivamente hacia la espalda.', 180, 0, 4, 'Espalda baja'),
('22222222-0000-0000-0000-000000000003', 'Savasana con escaneo corporal', 'Relaja conscientemente cada parte del cuerpo desde los pies hasta la cabeza.', 300, 0, 5, 'Relajación total');

-- ── PILATES EXERCISES ──────────────────────────────────────────────────────

-- Core Pilates Básico
INSERT INTO exercises (routine_id, name, description, sets, reps, duration_seconds, rest_seconds, order_index, muscle_group) VALUES
('33333333-0000-0000-0000-000000000001', 'The Hundred', 'Tumbado, piernas en tabla. Brazos bombean 100 veces respirando 5 in/5 out.', 1, NULL, 100, 30, 1, 'Core, Respiración'),
('33333333-0000-0000-0000-000000000001', 'Roll Up', 'Desde tumbado, articula la columna vertebra a vertebra hasta sentarte.', 3, 8, NULL, 45, 2, 'Core, Columna'),
('33333333-0000-0000-0000-000000000001', 'Single Leg Circles', 'Tumbado, una pierna al techo. Dibuja círculos pequeños con control de cadera.', 3, 8, NULL, 30, 3, 'Cadera, Core'),
('33333333-0000-0000-0000-000000000001', 'Rolling Like a Ball', 'Posición de bola, rueda hacia atrás y vuelve al equilibrio. Columna redondeada.', 3, 8, NULL, 30, 4, 'Columna, Core'),
('33333333-0000-0000-0000-000000000001', 'Single Leg Stretch', 'Tumbado, una rodilla al pecho, otra extendida. Alterna con control del core.', 3, 10, NULL, 30, 5, 'Core, Cadera'),
('33333333-0000-0000-0000-000000000001', 'Double Leg Stretch', 'Ambas rodillas al pecho, extiende brazos y piernas simultáneamente.', 3, 8, NULL, 45, 6, 'Core'),
('33333333-0000-0000-0000-000000000001', 'Spine Stretch Forward', 'Sentado, piernas abiertas. Alarga la columna hacia adelante articula el c, no dobla.', 3, 8, NULL, 30, 7, 'Espalda, Isquiotibiales'),
('33333333-0000-0000-0000-000000000001', 'Saw', 'Sentado con rotación de torso. Alcanza el pie exterior con la mano opuesta.', 3, 6, NULL, 30, 8, 'Oblicuos, Isquiotibiales');

-- Pilates Reformer Style
INSERT INTO exercises (routine_id, name, description, sets, reps, duration_seconds, rest_seconds, order_index, muscle_group) VALUES
('33333333-0000-0000-0000-000000000002', 'Teaser', 'Desde tumbado, sube en V equilibrándote sobre el cóccix con piernas y tronco al mismo ángulo.', 3, 5, NULL, 60, 1, 'Core completo'),
('33333333-0000-0000-0000-000000000002', 'Corkscrew', 'Piernas al techo, dibuja círculos grandes controlando con el core.', 3, 6, NULL, 45, 2, 'Oblicuos, Cadera'),
('33333333-0000-0000-0000-000000000002', 'Swimming', 'Boca abajo, brazos y piernas opuestos suben y bajan alternativamente.', 3, NULL, 30, 30, 3, 'Espalda, Glúteos'),
('33333333-0000-0000-0000-000000000002', 'Leg Pull Front (plancha)', 'Plancha, levanta una pierna alternando. Caderas estables.', 3, 8, NULL, 45, 4, 'Core, Glúteos'),
('33333333-0000-0000-0000-000000000002', 'Side Kick (cada lado)', 'Tumbado de lado, levanta y mueve la pierna en distintos planos.', 3, 10, NULL, 30, 5, 'Abductores, Core'),
('33333333-0000-0000-0000-000000000002', 'Seal', 'Posición de bola con tobillos agarrados, rueda y abre las rodillas al final.', 3, 8, NULL, 30, 6, 'Columna, Cadera'),
('33333333-0000-0000-0000-000000000002', 'Neck Pull', 'Manos detrás de la nuca, Roll Up articulando la columna con más resistencia.', 3, 6, NULL, 45, 7, 'Core, Columna'),
('33333333-0000-0000-0000-000000000002', 'Scissors', 'Piernas al techo, alterna llevando una hacia la cara y la otra al suelo.', 3, 10, NULL, 30, 8, 'Core, Isquiotibiales');

-- Pilates Power Flow
INSERT INTO exercises (routine_id, name, description, sets, reps, duration_seconds, rest_seconds, order_index, muscle_group) VALUES
('33333333-0000-0000-0000-000000000003', 'Control Balance', 'En posición invertida (hombros), una pierna baja tocando el suelo detrás de la cabeza.', 3, 5, NULL, 60, 1, 'Core, Equilibrio'),
('33333333-0000-0000-0000-000000000003', 'Boomerang', 'Combinación de Teaser, Rollover y volver al equilibrio en una secuencia fluida.', 3, 5, NULL, 60, 2, 'Core completo'),
('33333333-0000-0000-0000-000000000003', 'Jackknife', 'Desde tumbado, lanza las piernas al techo (90°) y luego extiéndelas hacia arriba verticalmente.', 3, 5, NULL, 60, 3, 'Core, Espalda'),
('33333333-0000-0000-0000-000000000003', 'Hip Circles', 'Apoyado en brazos detrás, caderas en el aire. Dibuja círculos con las piernas extendidas.', 3, 6, NULL, 45, 4, 'Core, Cadera'),
('33333333-0000-0000-0000-000000000003', 'Push Up Pilates', 'Des de de pie, dobla y baja a cuatro patas, haz una flexión y vuelve de pie articulando.', 3, 8, NULL, 45, 5, 'Pecho, Core, Columna'),
('33333333-0000-0000-0000-000000000003', 'Star (Side Plank)', 'Plancha lateral levantando el brazo y pierna superior. Cuerpo en línea diagonal.', 3, NULL, 30, 30, 6, 'Oblicuos, Hombro'),
('33333333-0000-0000-0000-000000000003', 'Rocking', 'Boca abajo, agarra los tobillos y balancea hacia adelante y atrás.', 3, 8, NULL, 45, 7, 'Columna, Cuádriceps, Pecho'),
('33333333-0000-0000-0000-000000000003', 'Open Leg Rocker', 'Equilibrio en cóccix con piernas extendidas en V. Rueda y vuelve al equilibrio.', 3, 6, NULL, 45, 8, 'Core, Isquiotibiales');

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_users_trainer_id ON users(trainer_id);
CREATE INDEX IF NOT EXISTS idx_exercises_routine_id ON exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_routines_user_id ON user_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_category ON routines(category);
CREATE INDEX IF NOT EXISTS idx_routines_is_public ON routines(is_public);

-- ─── SOCIAL / FEED ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT,
  image_url    TEXT,
  likes_count  INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select"  ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert"  ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_update"  ON posts FOR UPDATE USING (true);
CREATE POLICY "posts_delete"  ON posts FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "likes_delete" ON post_likes FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select" ON user_follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON user_follows FOR INSERT WITH CHECK (true);
CREATE POLICY "follows_delete" ON user_follows FOR DELETE USING (true);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_posts_user_id   ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created   ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);

-- ─── FEED POSTS (community feed) ─────────────────────────────────────────────
-- This table is referenced by feedStore.ts. Run these in Supabase SQL Editor
-- if feed_posts does not exist yet, or run only the ALTER if it already does.

CREATE TABLE IF NOT EXISTS feed_posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_uid   TEXT NOT NULL,
  user_name      TEXT,
  user_avatar    TEXT,
  content        TEXT,
  image_url      TEXT,
  workout_data   JSONB,
  likes_count    INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_likes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  supabase_uid TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, supabase_uid)
);

CREATE TABLE IF NOT EXISTS feed_comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id      UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  supabase_uid TEXT NOT NULL,
  user_name    TEXT,
  user_avatar  TEXT,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feed_posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_posts_select"   ON feed_posts   FOR SELECT USING (true);
CREATE POLICY "feed_posts_insert"   ON feed_posts   FOR INSERT WITH CHECK (true);
CREATE POLICY "feed_posts_update"   ON feed_posts   FOR UPDATE USING (true);
CREATE POLICY "feed_posts_delete"   ON feed_posts   FOR DELETE USING (true);

CREATE POLICY "feed_likes_select"   ON feed_likes   FOR SELECT USING (true);
CREATE POLICY "feed_likes_insert"   ON feed_likes   FOR INSERT WITH CHECK (true);
CREATE POLICY "feed_likes_delete"   ON feed_likes   FOR DELETE USING (true);

CREATE POLICY "feed_comments_select" ON feed_comments FOR SELECT USING (true);
CREATE POLICY "feed_comments_insert" ON feed_comments FOR INSERT WITH CHECK (true);

-- If feed_posts already exists but is missing workout_data:
ALTER TABLE feed_posts ADD COLUMN IF NOT EXISTS workout_data JSONB;


