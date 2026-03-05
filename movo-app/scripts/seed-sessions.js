/**
 * MOVO — Seed Script: Entrenamientos para gráficas del dashboard
 *
 * Inserta sesiones de entrenamiento completadas en los últimos 30 días
 * para todos los usuarios existentes en la base de datos.
 *
 * Uso:
 *   cd movo-app
 *   node scripts/seed-sessions.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = 'https://uyxysrodgxxduzyekgjo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eHlzcm9kZ3h4ZHV6eWVrZ2pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAwMzUwMiwiZXhwIjoyMDg3NTc5NTAyfQ.OlobzLVA1liEG05a3tvKzFqpkofbn5pcpKFtNXGJAek';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// IDs de rutinas seed (del supabase-schema.sql)
const ROUTINE_IDS = [
    '11111111-0000-0000-0000-000000000001', // Full Body Principiante (gym)
    '11111111-0000-0000-0000-000000000002', // Hipertrofia Tren Superior (gym)
    '11111111-0000-0000-0000-000000000003', // Lower Body Power (gym)
    '22222222-0000-0000-0000-000000000001', // Yoga Matutino (yoga)
    '22222222-0000-0000-0000-000000000002', // Yoga Flexibilidad (yoga)
    '22222222-0000-0000-0000-000000000003', // Yoga Restaurativo (yoga)
    '33333333-0000-0000-0000-000000000001', // Core Pilates (pilates)
    '33333333-0000-0000-0000-000000000002', // Pilates Reformer (pilates)
    '33333333-0000-0000-0000-000000000003', // Pilates Power Flow (pilates)
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Fecha ISO hace N días a una hora aleatoria */
function daysAgo(n, hourOffset = 0) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(7 + Math.floor(Math.random() * 13) + hourOffset, Math.floor(Math.random() * 60), 0, 0);
    return d.toISOString();
}

/** Número aleatorio entre min y max */
function rand(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

/** Elige un elemento aleatorio de un array */
function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Genera un patrón de días de entrenamiento para los últimos 30 días.
 * Simula que el usuario entrena 3-5 días por semana con descansos realistas.
 */
function generateTrainingDays(totalDays = 30, sessionsPerWeek = rand(3, 5)) {
    const days = [];
    for (let week = 0; week < Math.ceil(totalDays / 7); week++) {
        // Días de esta semana disponibles (0-6 = hace N días)
        const weekStart = week * 7;
        const weekEnd = Math.min(weekStart + 6, totalDays - 1);
        const available = [];
        for (let d = weekStart; d <= weekEnd; d++) available.push(d);

        // Seleccionar días de entrenamiento aleatorios sin repetir
        const shuffled = available.sort(() => Math.random() - 0.5);
        const trainingDays = shuffled.slice(0, Math.min(sessionsPerWeek, available.length));
        days.push(...trainingDays);
    }
    return days.sort((a, b) => b - a); // más reciente primero
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🏋️  MOVO — Seeding workout sessions...\n');

    // 1. Obtener todos los usuarios
    const { data: users, error: usersErr } = await supabase
        .from('users')
        .select('id, full_name, email, role');

    if (usersErr) {
        console.error('❌ Error obteniendo usuarios:', usersErr.message);
        process.exit(1);
    }

    if (!users || users.length === 0) {
        console.log('⚠️  No hay usuarios en la base de datos. Ejecuta seed-trainer-clients.js primero.');
        process.exit(0);
    }

    console.log(`👥 Usuarios encontrados: ${users.length}`);
    console.log('────────────────────────────────────────');

    let totalInserted = 0;

    for (const user of users) {
        // Entrenadores entrenan menos frecuente (demo)
        const freqPerWeek = user.role === 'trainer' ? rand(2, 3) : rand(3, 5);
        const trainingDays = generateTrainingDays(30, freqPerWeek);

        const sessions = trainingDays.map(daysBack => {
            const routineId = pick(ROUTINE_IDS);
            const duration = rand(25, 65);
            const calories = Math.round(duration * rand(6, 10));
            const startedAt = daysAgo(daysBack);
            const completedAt = new Date(new Date(startedAt).getTime() + duration * 60 * 1000).toISOString();

            return {
                user_id: user.id,
                routine_id: routineId,
                started_at: startedAt,
                completed_at: completedAt,
                duration_minutes: duration,
                calories_burned: calories,
                rating: rand(3, 5),
                notes: null,
            };
        });

        // Insertar sesiones del usuario (ignorar duplicados)
        const { error: insertErr, data: inserted } = await supabase
            .from('workout_sessions')
            .insert(sessions)
            .select('id');

        if (insertErr) {
            console.log(`  ❌ ${user.full_name || user.email}: ${insertErr.message}`);
        } else {
            const count = inserted?.length ?? sessions.length;
            totalInserted += count;
            console.log(`  ✅ ${(user.full_name || user.email).padEnd(28)} → ${count} sesiones (${freqPerWeek}x/semana)`);
        }
    }

    console.log('────────────────────────────────────────');
    console.log(`\n✅ Completado. Total sesiones insertadas: ${totalInserted}`);
    console.log('📊 Abre la app y recarga el dashboard para ver las gráficas.\n');
}

main().catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
});
