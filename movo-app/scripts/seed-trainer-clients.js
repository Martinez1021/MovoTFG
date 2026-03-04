/**
 * MOVO — Seed Script: Entrenadores + Clientes asignados
 *
 * Genera 3 entrenadores y 15 clientes (5 por entrenador).
 * Al finalizar imprime una tabla con todos los usuarios y sus contraseñas.
 *
 * Uso:
 *   cd movo-app
 *   node scripts/seed-trainer-clients.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL     = 'https://uyxysrodgxxduzyekgjo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eHlzcm9kZ3h4ZHV6eWVrZ2pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAwMzUwMiwiZXhwIjoyMDg3NTc5NTAyfQ.OlobzLVA1liEG05a3tvKzFqpkofbn5pcpKFtNXGJAek';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ─── ENTRENADORES ─────────────────────────────────────────────────────────────
const TRAINERS = [
    {
        email: 'trainer.marcos@movo.app',
        password: 'Trainer001!',
        full_name: 'Marcos Vidal',
        avatar_url: 'https://i.pravatar.cc/150?img=57',
        role: 'trainer',
        profile: { weight_kg: 82, height_cm: 180, age: 34, gender: 'male', activity_level: 'advanced', goals: ['strength', 'muscle_gain'], preferred_types: ['gym'] },
    },
    {
        email: 'trainer.laura@movo.app',
        password: 'Trainer002!',
        full_name: 'Laura Serrano',
        avatar_url: 'https://i.pravatar.cc/150?img=45',
        role: 'trainer',
        profile: { weight_kg: 61, height_cm: 167, age: 29, gender: 'female', activity_level: 'advanced', goals: ['flexibility', 'general_fitness'], preferred_types: ['yoga', 'pilates'] },
    },
    {
        email: 'trainer.roberto@movo.app',
        password: 'Trainer003!',
        full_name: 'Roberto Fuentes',
        avatar_url: 'https://i.pravatar.cc/150?img=60',
        role: 'trainer',
        profile: { weight_kg: 90, height_cm: 185, age: 38, gender: 'male', activity_level: 'advanced', goals: ['strength', 'endurance'], preferred_types: ['gym'] },
    },
];

// ─── CLIENTES (5 por entrenador) ──────────────────────────────────────────────
// trainerIndex: 0=Marcos, 1=Laura, 2=Roberto
const CLIENTS = [
    // ── Clientes de Marcos (gym) ─────────────────────────────────────────────
    {
        email: 'ivan.casado@movo.app', password: 'Cliente001!', full_name: 'Iván Casado',
        avatar_url: 'https://i.pravatar.cc/150?img=4', role: 'user', trainerIndex: 0,
        profile: { weight_kg: 88, height_cm: 181, age: 27, gender: 'male', activity_level: 'intermediate', goals: ['muscle_gain', 'strength'], preferred_types: ['gym'] },
    },
    {
        email: 'nuria.blanco@movo.app', password: 'Cliente002!', full_name: 'Nuria Blanco',
        avatar_url: 'https://i.pravatar.cc/150?img=38', role: 'user', trainerIndex: 0,
        profile: { weight_kg: 63, height_cm: 166, age: 24, gender: 'female', activity_level: 'beginner', goals: ['weight_loss', 'muscle_gain'], preferred_types: ['gym'] },
    },
    {
        email: 'oscar.navarro@movo.app', password: 'Cliente003!', full_name: 'Óscar Navarro',
        avatar_url: 'https://i.pravatar.cc/150?img=11', role: 'user', trainerIndex: 0,
        profile: { weight_kg: 95, height_cm: 184, age: 31, gender: 'male', activity_level: 'advanced', goals: ['strength', 'endurance'], preferred_types: ['gym'] },
    },
    {
        email: 'beatriz.perez@movo.app', password: 'Cliente004!', full_name: 'Beatriz Pérez',
        avatar_url: 'https://i.pravatar.cc/150?img=43', role: 'user', trainerIndex: 0,
        profile: { weight_kg: 59, height_cm: 164, age: 26, gender: 'female', activity_level: 'intermediate', goals: ['general_fitness', 'strength'], preferred_types: ['gym', 'pilates'] },
    },
    {
        email: 'sergio.molina@movo.app', password: 'Cliente005!', full_name: 'Sergio Molina',
        avatar_url: 'https://i.pravatar.cc/150?img=17', role: 'user', trainerIndex: 0,
        profile: { weight_kg: 78, height_cm: 177, age: 22, gender: 'male', activity_level: 'beginner', goals: ['muscle_gain', 'general_fitness'], preferred_types: ['gym'] },
    },

    // ── Clientes de Laura (yoga / pilates) ───────────────────────────────────
    {
        email: 'marta.iglesias@movo.app', password: 'Cliente006!', full_name: 'Marta Iglesias',
        avatar_url: 'https://i.pravatar.cc/150?img=40', role: 'user', trainerIndex: 1,
        profile: { weight_kg: 57, height_cm: 163, age: 28, gender: 'female', activity_level: 'beginner', goals: ['flexibility', 'general_fitness'], preferred_types: ['yoga'] },
    },
    {
        email: 'raquel.cabrera@movo.app', password: 'Cliente007!', full_name: 'Raquel Cabrera',
        avatar_url: 'https://i.pravatar.cc/150?img=46', role: 'user', trainerIndex: 1,
        profile: { weight_kg: 60, height_cm: 168, age: 33, gender: 'female', activity_level: 'intermediate', goals: ['flexibility', 'weight_loss'], preferred_types: ['yoga', 'pilates'] },
    },
    {
        email: 'adriana.medina@movo.app', password: 'Cliente008!', full_name: 'Adriana Medina',
        avatar_url: 'https://i.pravatar.cc/150?img=42', role: 'user', trainerIndex: 1,
        profile: { weight_kg: 55, height_cm: 160, age: 21, gender: 'female', activity_level: 'beginner', goals: ['general_fitness', 'flexibility'], preferred_types: ['pilates'] },
    },
    {
        email: 'victor.santos@movo.app', password: 'Cliente009!', full_name: 'Víctor Santos',
        avatar_url: 'https://i.pravatar.cc/150?img=13', role: 'user', trainerIndex: 1,
        profile: { weight_kg: 74, height_cm: 176, age: 35, gender: 'male', activity_level: 'intermediate', goals: ['flexibility', 'endurance'], preferred_types: ['yoga'] },
    },
    {
        email: 'irene.vargas@movo.app', password: 'Cliente010!', full_name: 'Irene Vargas',
        avatar_url: 'https://i.pravatar.cc/150?img=48', role: 'user', trainerIndex: 1,
        profile: { weight_kg: 64, height_cm: 169, age: 30, gender: 'female', activity_level: 'intermediate', goals: ['weight_loss', 'flexibility'], preferred_types: ['pilates', 'yoga'] },
    },

    // ── Clientes de Roberto (gym / fuerza) ───────────────────────────────────
    {
        email: 'daniel.campos@movo.app', password: 'Cliente011!', full_name: 'Daniel Campos',
        avatar_url: 'https://i.pravatar.cc/150?img=20', role: 'user', trainerIndex: 2,
        profile: { weight_kg: 85, height_cm: 180, age: 25, gender: 'male', activity_level: 'intermediate', goals: ['strength', 'muscle_gain'], preferred_types: ['gym'] },
    },
    {
        email: 'alvaro.ortega@movo.app', password: 'Cliente012!', full_name: 'Álvaro Ortega',
        avatar_url: 'https://i.pravatar.cc/150?img=16', role: 'user', trainerIndex: 2,
        profile: { weight_kg: 100, height_cm: 186, age: 29, gender: 'male', activity_level: 'advanced', goals: ['strength', 'endurance'], preferred_types: ['gym'] },
    },
    {
        email: 'cristina.reyes@movo.app', password: 'Cliente013!', full_name: 'Cristina Reyes',
        avatar_url: 'https://i.pravatar.cc/150?img=37', role: 'user', trainerIndex: 2,
        profile: { weight_kg: 67, height_cm: 171, age: 27, gender: 'female', activity_level: 'intermediate', goals: ['strength', 'general_fitness'], preferred_types: ['gym'] },
    },
    {
        email: 'hugo.delgado@movo.app', password: 'Cliente014!', full_name: 'Hugo Delgado',
        avatar_url: 'https://i.pravatar.cc/150?img=19', role: 'user', trainerIndex: 2,
        profile: { weight_kg: 72, height_cm: 174, age: 23, gender: 'male', activity_level: 'beginner', goals: ['muscle_gain', 'weight_loss'], preferred_types: ['gym'] },
    },
    {
        email: 'patricia.ruano@movo.app', password: 'Cliente015!', full_name: 'Patricia Ruano',
        avatar_url: 'https://i.pravatar.cc/150?img=50', role: 'user', trainerIndex: 2,
        profile: { weight_kg: 61, height_cm: 165, age: 32, gender: 'female', activity_level: 'intermediate', goals: ['muscle_gain', 'strength'], preferred_types: ['gym', 'pilates'] },
    },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
async function createOrGetUser(userData) {
    // Try to create via auth admin
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: { full_name: userData.full_name, role: userData.role, avatar_url: userData.avatar_url },
    });

    if (createErr) {
        if (createErr.message?.toLowerCase().includes('already') || createErr.message?.toLowerCase().includes('exists')) {
            // User exists — fetch their supabase_id from public.users
            const { data: existing } = await supabase
                .from('users')
                .select('id, supabase_id')
                .eq('email', userData.email)
                .maybeSingle();
            return existing ?? null;
        }
        throw createErr;
    }

    const supabaseUid = created.user.id;

    // Upsert into public.users
    const { data: row, error: upsertErr } = await supabase
        .from('users')
        .upsert({
            supabase_id: supabaseUid,
            email: userData.email,
            full_name: userData.full_name,
            avatar_url: userData.avatar_url,
            role: userData.role,
        }, { onConflict: 'supabase_id' })
        .select('id, supabase_id')
        .single();

    if (upsertErr) throw upsertErr;
    return row;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n════════════════════════════════════════════════');
    console.log('  MOVO — Seed: Entrenadores + Clientes');
    console.log('════════════════════════════════════════════════\n');

    // ── 1. Crear entrenadores ────────────────────────────────────────────────
    console.log('👨‍🏫 Creando entrenadores...\n');
    const trainerRows = [];
    for (const t of TRAINERS) {
        process.stdout.write(`  → ${t.full_name} (${t.email}) ... `);
        try {
            const row = await createOrGetUser(t);
            trainerRows.push({ ...t, dbId: row.id, supabaseId: row.supabase_id });
            console.log(`✅  id=${row.id}`);
        } catch (e) {
            console.log(`❌  ${e.message}`);
            trainerRows.push(null);
        }
    }

    // ── 2. Crear clientes y asignar trainer_id ───────────────────────────────
    console.log('\n👥 Creando clientes...\n');
    const clientRows = [];
    for (const c of CLIENTS) {
        const trainer = trainerRows[c.trainerIndex];
        if (!trainer) { clientRows.push(null); continue; }

        process.stdout.write(`  → ${c.full_name} (${c.email}) → entrenador: ${trainer.full_name} ... `);
        try {
            const row = await createOrGetUser(c);

            // Assign trainer_id in public.users
            await supabase
                .from('users')
                .update({ trainer_id: trainer.dbId })
                .eq('id', row.id);

            // Upsert user_profile
            await supabase.from('user_profiles').upsert({
                user_id: row.id,
                ...c.profile,
                notes_from_trainer: null,
            }, { onConflict: 'user_id' });

            clientRows.push({ ...c, dbId: row.id, supabaseId: row.supabase_id, trainerName: trainer.full_name });
            console.log(`✅  id=${row.id}`);
        } catch (e) {
            console.log(`❌  ${e.message}`);
            clientRows.push(null);
        }
    }

    // ── 3. Upsert trainer profiles ───────────────────────────────────────────
    for (const t of trainerRows) {
        if (!t?.dbId) continue;
        await supabase.from('user_profiles').upsert({
            user_id: t.dbId,
            ...t.profile,
        }, { onConflict: 'user_id' });
    }

    // ── 4. Auto-accept trainer requests (insert in trainer_requests approved) ─
    //    Use trainer_requests table if it exists; otherwise just skip
    for (const c of clientRows) {
        if (!c?.dbId) continue;
        const trainer = trainerRows[c.trainerIndex];
        if (!trainer?.dbId) continue;
        try {
            await supabase.from('trainer_requests').upsert({
                requester_id: c.dbId,
                trainer_id: trainer.dbId,
                status: 'accepted',
            }, { onConflict: 'requester_id,trainer_id', ignoreDuplicates: true });
        } catch (_) { /* tabla puede no existir */ }
    }

    // ── 5. Resumen final ─────────────────────────────────────────────────────
    console.log('\n\n════════════════════════════════════════════════');
    console.log('  TABLA DE USUARIOS CREADOS');
    console.log('════════════════════════════════════════════════\n');

    console.log('🏋️  ENTRENADORES\n');
    console.log(
        'Nombre'.padEnd(22) +
        'Email'.padEnd(35) +
        'Contraseña'.padEnd(16) +
        'DB ID'
    );
    console.log('─'.repeat(100));
    for (const t of trainerRows) {
        if (!t) continue;
        console.log(
            t.full_name.padEnd(22) +
            t.email.padEnd(35) +
            t.password.padEnd(16) +
            (t.dbId ?? 'error')
        );
    }

    console.log('\n👤  CLIENTES\n');
    console.log(
        'Nombre'.padEnd(22) +
        'Email'.padEnd(35) +
        'Contraseña'.padEnd(16) +
        'Entrenador'.padEnd(20) +
        'DB ID'
    );
    console.log('─'.repeat(115));
    for (const c of clientRows) {
        if (!c) continue;
        console.log(
            c.full_name.padEnd(22) +
            c.email.padEnd(35) +
            c.password.padEnd(16) +
            c.trainerName.padEnd(20) +
            (c.dbId ?? 'error')
        );
    }

    console.log('\n════════════════════════════════════════════════');
    console.log('✅  Seed completado');
    console.log('════════════════════════════════════════════════\n');
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
