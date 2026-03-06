-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  supabase-schema.sql — Esquema de la Base de Datos MOVO                     ║
-- ║  Ejecutar en Supabase → SQL Editor                                          ║
-- ║                                                                              ║
-- ║  CRITERIO 1 — JUSTIFICACIÓN DE POSTGRESQL:                                  ║
-- ║   • UUID como clave primaria: distribuido, sin colisiones, imposible         ║
-- ║     adivinar IDs (seguridad por oscuridad)                                  ║
-- ║   • TEXT[]: arrays nativos de PostgreSQL para goals y preferred_types       ║
-- ║     (evita tabla intermedia para listas simples de strings)                 ║
-- ║   • JSONB: ai_conversations.messages guarda todo el historial de chat       ║
-- ║     en un solo campo, con indexación y búsqueda eficiente                   ║
-- ║   • TIMESTAMPTZ: timestamps con zona horaria para usuarios globales         ║
-- ║   • CHECK constraints: validación de datos a nivel de BD (última barrera)  ║
-- ║   • Row Level Security (RLS): cada usuario sólo ve sus propios datos        ║
-- ║     (seguridad a nivel de fila, gestionada por PostgreSQL directamente)     ║
-- ║                                                                              ║
-- ║  CRITERIO 2 — DISEÑO DE LA BASE DE DATOS:                                   ║
-- ║   • 7 tablas: users, user_profiles, routines, exercises, user_routines,     ║
-- ║               workout_sessions, ai_conversations, trainer_messages          ║
-- ║   • 3FN: sin redundancia, cada campo depende sólo de la clave primaria     ║
-- ║   • Relación N:M: user_routines (usuario puede tener muchas rutinas,        ║
-- ║     y una rutina puede ser asignada a muchos usuarios)                      ║
-- ║   • FK CASCADE: al borrar un usuario, se borran todos sus datos asociados  ║
-- ║   • FK SET NULL: borrar entrenador → clients.trainer_id = NULL (no se      ║
-- ║     borran los clientes cuando se elimina su entrenador)                    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- CRITERIO 1: Extensión UUID de PostgreSQL para generar UUIDs v4 automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABLAS ──────────────────────────────────────────────────────────────────

-- CRITERIO 2 — TABLA 1: users
-- Tabla central del sistema. Relacionada con todas las demás tablas.
-- trainer_id → auto-referencia: un User puede ser cliente de otro User (entrenador)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- CRITERIO 1: UUID, no INT
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL CHECK (role IN ('trainer', 'user')) DEFAULT 'user',  -- CHECK constraint
  trainer_id  UUID REFERENCES users(id) ON DELETE SET NULL,  -- FK SET NULL (no cascade)
  supabase_id TEXT UNIQUE,   -- vincula con Supabase Auth (auth.users.id)
  created_at  TIMESTAMPTZ DEFAULT NOW()  -- CRITERIO 1: TIMESTAMPTZ con zona horaria
);

-- CRITERIO 2 — TABLA 2: user_profiles
-- Datos físicos separados de users: 3FN → los datos del perfil tienen su propia tabla
-- UNIQUE en user_id: relación 1:1 con users (un usuario, un perfil)
-- ON DELETE CASCADE: al borrar el usuario, se borra su perfil
CREATE TABLE IF NOT EXISTS user_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,  -- 1:1
  weight_kg           DECIMAL(5,2),     -- ej: 75.50 kg
  height_cm           INT,
  age                 INT,
  gender              TEXT CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  activity_level      TEXT CHECK (activity_level IN ('sedentary', 'beginner', 'intermediate', 'advanced')),
  goals               TEXT[] DEFAULT '{}',          -- CRITERIO 1: array nativo PostgreSQL
  preferred_types     TEXT[] DEFAULT '{}',          -- ej: {'yoga', 'pilates'}
  available_days      INT DEFAULT 3,
  session_duration    INT DEFAULT 45,
  notes_from_trainer  TEXT,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- CRITERIO 2 — TABLA 3: routines
-- Catálogo de rutinas de entrenamiento. Una rutina contiene muchos ejercicios (1:N).
-- created_by → FK a users (entrenador que la creó). NULL = rutina del sistema.
-- is_public → controla visibilidad (RLS filtra las privadas)
CREATE TABLE IF NOT EXISTS routines (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL CHECK (category IN ('gym', 'yoga', 'pilates')),  -- CHECK
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_minutes INT,
  created_by       UUID REFERENCES users(id),  -- FK nullable (NULL = sistema)
  is_public        BOOLEAN DEFAULT TRUE,
  thumbnail_url    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- CRITERIO 2 — TABLA 4: exercises
-- Relación 1:N con routines. Cada ejercicio pertenece a exactamente 1 rutina.
-- ON DELETE CASCADE → al borrar la rutina, se borran todos sus ejercicios
-- order_index: orden de ejecución dentro de la rutina
CREATE TABLE IF NOT EXISTS exercises (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id       UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,  -- 1:N cascade
  name             TEXT NOT NULL,
  description      TEXT,
  sets             INT,
  reps             INT,
  duration_seconds INT,   -- para ejercicios por tiempo (plancha, etc.) en lugar de reps
  rest_seconds     INT DEFAULT 60,
  order_index      INT NOT NULL DEFAULT 0,  -- posición en la rutina (usado para ordenar)
  video_url        TEXT,
  image_url        TEXT,
  muscle_group     TEXT
);

-- CRITERIO 2 — TABLA 5: user_routines (relación N:M)
-- Tabla de unión entre users y routines.
-- CRITERIO 1 JUSTIFICACIÓN: N:M requiere tabla intermedia en cualquier SGBD relacional.
-- Un usuario puede tener asignadas muchas rutinas, y una rutina puede asignarse a muchos.
-- UNIQUE(user_id, routine_id) → no se puede asignar la misma rutina dos veces al mismo usuario
CREATE TABLE IF NOT EXISTS user_routines (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,     -- → usuarios
  routine_id   UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,  -- → rutinas
  assigned_by  UUID REFERENCES users(id),  -- entrenador que asignó la rutina (puede ser NULL)
  start_date   DATE,
  end_date     DATE,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  UNIQUE(user_id, routine_id)  -- constraint de unicidad compuesto
);

-- CRITERIO 2 — TABLA 6: workout_sessions
-- Registro histórico de cada sesión de entrenamiento completa.
-- Al completar → completedAt se rellena (en SessionController.java)
-- rating: valoración del usuario 1-5 (CHECK en BD, no sólo en aplicación)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  routine_id       UUID NOT NULL REFERENCES routines(id),  -- no cascade (referencia histórica)
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,   -- NULL = sesión en progreso
  duration_minutes INT,
  calories_burned  INT,
  notes            TEXT,
  rating           INT CHECK (rating BETWEEN 1 AND 5)  -- CRITERIO 1: CHECK constraint
);

-- CRITERIO 2 — TABLA 7: ai_conversations
-- CRITERIO 1 JUSTIFICACIÓN: messages es JSONB → almacena el historial completo de chat
-- en PostgreSQL de forma eficiente. Permite consultas dentro del JSON con operadores ->> y @>
-- Sin JSONB necesitaríamos una tabla ai_messages separada con muchos joins.
CREATE TABLE IF NOT EXISTS ai_conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages    JSONB DEFAULT '[]',  -- CRITERIO 1: JSONB nativo de PostgreSQL
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CRITERIO 2 — TABLA 8: trainer_messages
-- Mensajes entre entrenadores y sus clientes (sistema de mensajería interna).
-- Dos FKs a users: trainer_id y user_id (ambos son filas de la tabla users)
CREATE TABLE IF NOT EXISTS trainer_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id  UUID NOT NULL REFERENCES users(id),  -- FK al entrenador
  user_id     UUID NOT NULL REFERENCES users(id),  -- FK al cliente
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,  -- para mostrar el contador de mensajes no leídos
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────────────────────────────────────
-- CRITERIO 1 + 5 — JUSTIFICACIÓN Y SEGURIDAD:
-- RLS es una característica nativa de PostgreSQL.
-- Añade una capa de seguridad a nivel de BD: aunque alguien tenga acceso directo
-- a la BD, sólo puede ver/modificar sus propias filas.
-- auth.uid() = función de Supabase que devuelve el UUID del usuario autenticado con JWT.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_messages ENABLE ROW LEVEL SECURITY;

-- POLÍTICA users: lectura pública (necesario para mostrar perfiles de entrenadores)
-- escritura: sólo puede actualizar su propia fila (supabase_id = auth.uid())
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid()::text = supabase_id);

-- POLÍTICA user_profiles: sólo el propio usuario puede ver/editar su perfil físico
CREATE POLICY "profiles_own" ON user_profiles USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- POLÍTICA routines: rutinas públicas visibles para todos; las privadas sólo para su creador
CREATE POLICY "routines_public" ON routines FOR SELECT USING (is_public = true);
CREATE POLICY "routines_own" ON routines FOR ALL USING (created_by IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- POLÍTICA workout_sessions: cada usuario sólo ve sus propias sesiones
CREATE POLICY "sessions_own" ON workout_sessions USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()::text));

-- POLÍTICA ai_conversations: cada usuario sólo ve su propio historial de chat con la IA
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

-- ─── AUTO-SYNC TRIGGER ───────────────────────────────────────────────────────
-- Creates/updates public.users row whenever a Supabase auth user signs up or logs in
-- This ensures supabase_id is always populated even if the backend is offline

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
    email      = EXCLUDED.email,
    full_name  = COALESCE(EXCLUDED.full_name, public.users.full_name),
    role       = COALESCE(EXCLUDED.role, public.users.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_upsert();

-- Backfill: populate users row for ALL existing Supabase auth users
-- (covers anyone who registered when backend was offline)
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
  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);

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

-- ─── FOLLOW REQUESTS ─────────────────────────────────────────────────────────
-- requester_id / target_id = users.id (internal UUID from users table)
CREATE TABLE IF NOT EXISTS follow_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, target_id)
);
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follow_req_select" ON follow_requests FOR SELECT USING (true);
CREATE POLICY "follow_req_insert" ON follow_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "follow_req_update" ON follow_requests FOR UPDATE USING (true);
CREATE POLICY "follow_req_delete" ON follow_requests FOR DELETE USING (true);

-- ─── DIRECT MESSAGES ─────────────────────────────────────────────────────────
-- sender_uid / receiver_uid = supabase auth UID (TEXT), matches auth.uid()
CREATE TABLE IF NOT EXISTS direct_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_uid   TEXT NOT NULL,
  receiver_uid TEXT NOT NULL,
  content      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
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
CREATE INDEX IF NOT EXISTS idx_dm_pair     ON direct_messages(sender_uid, receiver_uid, created_at DESC);


