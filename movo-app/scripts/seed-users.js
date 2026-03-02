/**
 * MOVO — Seed Script for Fake Users
 * 
 * Prerequisites:
 *   npm install @supabase/supabase-js
 *
 * Usage:
 *   1. Set SERVICE_ROLE_KEY below (Supabase Dashboard → Settings → API → service_role)
 *   2. node scripts/seed-users.js
 *
 * This script:
 *   - Creates 12 fake Supabase Auth users
 *   - Inserts their public users + user_profiles rows
 *   - Inserts feed posts with workout data
 *   - Inserts some follow relationships
 */

const { createClient } = require('@supabase/supabase-js');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://uyxysrodgxxduzyekgjo.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eHlzcm9kZ3h4ZHV6eWVrZ2pvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAwMzUwMiwiZXhwIjoyMDg3NTc5NTAyfQ.OlobzLVA1liEG05a3tvKzFqpkofbn5pcpKFtNXGJAek'; // ← pega aquí tu service_role key

// ─────────────────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ─── FAKE USERS DATA ─────────────────────────────────────────────────────────
const FAKE_USERS = [
    {
        email: 'carlos.ruiz@movo.app',
        password: 'Movo2024!',
        full_name: 'Carlos Ruiz',
        avatar_url: 'https://i.pravatar.cc/150?img=3',
        role: 'user',
        profile: { weight_kg: 80, height_cm: 179, age: 26, gender: 'male', activity_level: 'advanced', goals: ['muscle_gain', 'strength'], preferred_types: ['gym'] },
        is_public: true,
    },
    {
        email: 'sofia.martin@movo.app',
        password: 'Movo2024!',
        full_name: 'Sofía Martín',
        avatar_url: 'https://i.pravatar.cc/150?img=47',
        role: 'user',
        profile: { weight_kg: 58, height_cm: 165, age: 24, gender: 'female', activity_level: 'intermediate', goals: ['weight_loss', 'flexibility'], preferred_types: ['yoga', 'pilates'] },
        is_public: true,
    },
    {
        email: 'alejandro.garcia@movo.app',
        password: 'Movo2024!',
        full_name: 'Alejandro García',
        avatar_url: 'https://i.pravatar.cc/150?img=8',
        role: 'user',
        profile: { weight_kg: 92, height_cm: 183, age: 30, gender: 'male', activity_level: 'advanced', goals: ['muscle_gain', 'strength'], preferred_types: ['gym'] },
        is_public: false,
    },
    {
        email: 'lucia.fernandez@movo.app',
        password: 'Movo2024!',
        full_name: 'Lucía Fernández',
        avatar_url: 'https://i.pravatar.cc/150?img=44',
        role: 'user',
        profile: { weight_kg: 62, height_cm: 168, age: 22, gender: 'female', activity_level: 'beginner', goals: ['general_fitness', 'flexibility'], preferred_types: ['yoga'] },
        is_public: true,
    },
    {
        email: 'pablo.sanchez@movo.app',
        password: 'Movo2024!',
        full_name: 'Pablo Sánchez',
        avatar_url: 'https://i.pravatar.cc/150?img=12',
        role: 'user',
        profile: { weight_kg: 75, height_cm: 176, age: 28, gender: 'male', activity_level: 'intermediate', goals: ['endurance', 'weight_loss'], preferred_types: ['gym'] },
        is_public: true,
    },
    {
        email: 'ana.lopez@movo.app',
        password: 'Movo2024!',
        full_name: 'Ana López',
        avatar_url: 'https://i.pravatar.cc/150?img=49',
        role: 'user',
        profile: { weight_kg: 55, height_cm: 162, age: 25, gender: 'female', activity_level: 'intermediate', goals: ['muscle_gain', 'general_fitness'], preferred_types: ['pilates', 'gym'] },
        is_public: true,
    },
    {
        email: 'miguel.torres@movo.app',
        password: 'Movo2024!',
        full_name: 'Miguel Torres',
        avatar_url: 'https://i.pravatar.cc/150?img=15',
        role: 'user',
        profile: { weight_kg: 85, height_cm: 181, age: 32, gender: 'male', activity_level: 'advanced', goals: ['strength', 'muscle_gain'], preferred_types: ['gym'] },
        is_public: false,
    },
    {
        email: 'elena.diaz@movo.app',
        password: 'Movo2024!',
        full_name: 'Elena Díaz',
        avatar_url: 'https://i.pravatar.cc/150?img=41',
        role: 'user',
        profile: { weight_kg: 60, height_cm: 167, age: 27, gender: 'female', activity_level: 'intermediate', goals: ['flexibility', 'general_fitness'], preferred_types: ['yoga', 'pilates'] },
        is_public: true,
    },
    {
        email: 'david.moreno@movo.app',
        password: 'Movo2024!',
        full_name: 'David Moreno',
        avatar_url: 'https://i.pravatar.cc/150?img=18',
        role: 'user',
        profile: { weight_kg: 70, height_cm: 175, age: 23, gender: 'male', activity_level: 'beginner', goals: ['weight_loss', 'general_fitness'], preferred_types: ['gym'] },
        is_public: true,
    },
    {
        email: 'carmen.jimenez@movo.app',
        password: 'Movo2024!',
        full_name: 'Carmen Jiménez',
        avatar_url: 'https://i.pravatar.cc/150?img=36',
        role: 'user',
        profile: { weight_kg: 65, height_cm: 170, age: 29, gender: 'female', activity_level: 'advanced', goals: ['strength', 'muscle_gain'], preferred_types: ['gym', 'pilates'] },
        is_public: true,
    },
    {
        email: 'javier.hernandez@movo.app',
        password: 'Movo2024!',
        full_name: 'Javier Hernández',
        avatar_url: 'https://i.pravatar.cc/150?img=22',
        role: 'user',
        profile: { weight_kg: 88, height_cm: 182, age: 35, gender: 'male', activity_level: 'advanced', goals: ['strength', 'endurance'], preferred_types: ['gym'] },
        is_public: false,
    },
    {
        email: 'paula.romero@movo.app',
        password: 'Movo2024!',
        full_name: 'Paula Romero',
        avatar_url: 'https://i.pravatar.cc/150?img=39',
        role: 'user',
        profile: { weight_kg: 57, height_cm: 163, age: 21, gender: 'female', activity_level: 'beginner', goals: ['general_fitness', 'flexibility'], preferred_types: ['yoga'] },
        is_public: true,
    },
];

// ─── FEED POSTS per user ──────────────────────────────────────────────────────
const POSTS_PER_USER = [
    // Carlos
    [
        { content: '🏋️ Sesión de pecho brutal hoy. 4 series de press banca a 100kg. El progreso no para 💪', workout_data: { routine_name: 'Hipertrofia Tren Superior', duration_seconds: 3600, total_sets: 32, total_reps: 280, total_weight: 3200, effort_score: 9, exercises: [{ name: 'Press banca', muscle_group: 'Pecho', sets: [{ set: 1, reps: 8, weight: 100 }, { set: 2, reps: 8, weight: 100 }, { set: 3, reps: 7, weight: 102 }, { set: 4, reps: 6, weight: 105 }] }] } },
        { content: '¿Cuántos de vosotros hacéis sentadilla búlgara? Es el ejercicio que más odio y más amo a la vez 🔥 #legday', workout_data: null },
        { content: 'Nuevo PR en pull-ups: 15 repeticiones seguidas sin parar 🎯 La constancia da sus frutos', workout_data: { routine_name: 'Full Body Principiante', duration_seconds: 2700, total_sets: 24, total_reps: 200, total_weight: 1500, effort_score: 8, exercises: [] } },
    ],
    // Sofía
    [
        { content: '🧘‍♀️ Mañana de yoga para empezar la semana con calma. 30 minutos de Yoga Matutino y me siento nueva ✨', workout_data: { routine_name: 'Yoga Matutino 20min', duration_seconds: 1800, total_sets: 7, total_reps: 0, total_weight: 0, effort_score: 3, exercises: [] } },
        { content: 'La flexibilidad no se consigue en un día, pero cada sesión cuenta 💪 Semana 8 de práctica continua', workout_data: null },
        { content: 'Core Pilates Básico completado ✅ Cada semana noto más control en los movimientos #pilates #core', workout_data: { routine_name: 'Core Pilates Básico', duration_seconds: 1800, total_sets: 21, total_reps: 148, total_weight: 0, effort_score: 6, exercises: [] } },
    ],
    // Alejandro
    [
        { content: 'Lower Body Power 💥 200kg en prensa hoy. Las piernas ya no me responden pero valió la pena', workout_data: { routine_name: 'Lower Body Power', duration_seconds: 3000, total_sets: 28, total_reps: 210, total_weight: 5600, effort_score: 10, exercises: [] } },
        { content: 'Descanso activo: estiramientos + foam roller. El cuerpo lo agradece 🙏', workout_data: null },
    ],
    // Lucía
    [
        { content: 'Primera semana de yoga completada 🌟 Me cuesta pero se nota el progreso. ¡A por la segunda!', workout_data: null },
        { content: '🌿 Yoga Restaurativo después de una semana estresante. 5 minutos de Savasana y me quedé dormida lol', workout_data: { routine_name: 'Yoga Restaurativo', duration_seconds: 1800, total_sets: 5, total_reps: 0, total_weight: 0, effort_score: 2, exercises: [] } },
        { content: 'Postura del guerrero dominada ⚔️ Mi instructor dice que mi alineamiento mejora semana a semana', workout_data: null },
    ],
    // Pablo
    [
        { content: 'Entreno de piernas superado 🦵 La sentadilla búlgara me tiene en guerra psicológica pero no me rindo', workout_data: { routine_name: 'Lower Body Power', duration_seconds: 2700, total_sets: 24, total_reps: 192, total_weight: 2400, effort_score: 8, exercises: [] } },
        { content: '¿Alguien más nota que entrenar por la mañana mejora el humor el resto del día? 🌅 Yo ya no puedo vivir sin ello', workout_data: null },
    ],
    // Ana
    [
        { content: 'Pilates Power Flow completado ✨ Un mes de práctica y ya noto el cambio en mi postura 💪', workout_data: { routine_name: 'Pilates Power Flow', duration_seconds: 2400, total_sets: 24, total_reps: 144, total_weight: 0, effort_score: 7, exercises: [] } },
        { content: 'Mix de pilates + gym esta semana. Lo mejor que he probado 🔀 #crosstraining', workout_data: null },
        { content: 'Press banca 60kg x 5 reps 😱 Hace 3 meses no podía ni con 40. El trabajo da sus frutos', workout_data: { routine_name: 'Hipertrofia Tren Superior', duration_seconds: 3300, total_sets: 30, total_reps: 248, total_weight: 2800, effort_score: 8, exercises: [] } },
    ],
    // Miguel
    [
        { content: '🏋️ Full Body completado. 90 minutos de duro trabajo. El cuerpo pide descanso pero la mente pide más', workout_data: { routine_name: 'Full Body Principiante', duration_seconds: 5400, total_sets: 40, total_reps: 320, total_weight: 4200, effort_score: 9, exercises: [] } },
        { content: 'Deadlift 180kg. No hay más que decir. 🧱', workout_data: null },
    ],
    // Elena
    [
        { content: 'La mariposa sentada es mi postura favorita ahora mismo 🦋 Noto cómo se abre la cadera cada semana', workout_data: null },
        { content: 'Yoga para Flexibilidad ✅ La postura del arco ya no me da tanto miedo 😅', workout_data: { routine_name: 'Yoga para Flexibilidad', duration_seconds: 2400, total_sets: 8, total_reps: 0, total_weight: 0, effort_score: 5, exercises: [] } },
        { content: '¿Pilates o yoga? Llevo 6 meses con los dos y creo que no podría elegir. ¡Los dos me han cambiado la vida! 🌸', workout_data: null },
    ],
    // David
    [
        { content: 'Primer mes en el gym completado 💪 Peso 5kg menos y noto más energía. ¡Esto funciona!', workout_data: null },
        { content: 'Full Body Principiante x3 esta semana. El nombre ya no define cómo me siento después 😅😅', workout_data: { routine_name: 'Full Body Principiante', duration_seconds: 2700, total_sets: 24, total_reps: 192, total_weight: 1200, effort_score: 6, exercises: [] } },
    ],
    // Carmen
    [
        { content: 'Hipertrofia Tren Superior completada 💪 Aumenté 5kg en press banca esta semana. ¡A tope!', workout_data: { routine_name: 'Hipertrofia Tren Superior', duration_seconds: 3600, total_sets: 32, total_reps: 264, total_weight: 3500, effort_score: 9, exercises: [] } },
        { content: 'Chicas que hacéis pesas: no os da miedo el volumen, os da FORMA. Llevo 2 años y solo me arrepiento de no haber empezado antes 💪🔥', workout_data: null },
        { content: 'Pilates Reformer Style + Hipertrofia el mismo día 😱 El cuerpo ha dicho basta pero el corazón dice más', workout_data: { routine_name: 'Pilates Reformer Style', duration_seconds: 2700, total_sets: 24, total_reps: 168, total_weight: 0, effort_score: 7, exercises: [] } },
    ],
    // Javier
    [
        { content: 'Lower Body Power 🦵 Semana 12 de ciclo de fuerza. Los números no mienten: +15% en todos los movimientos compuestos', workout_data: { routine_name: 'Lower Body Power', duration_seconds: 3000, total_sets: 28, total_reps: 216, total_weight: 7200, effort_score: 10, exercises: [] } },
        { content: 'La consistencia es el rey. Sin motivación, con cansancio, con el día de mierda. Igual. Al gym.', workout_data: null },
    ],
    // Paula
    [
        { content: '🌸 Primera clase de yoga de mi vida ayer. Pensé que sería fácil... me equivoqué mucho 😅 ¡Pero repito!', workout_data: null },
        { content: 'Yoga Matutino completado ✨ Semana 2. La postura del guerrero ya no me tambaleo (tanto) 😂', workout_data: { routine_name: 'Yoga Matutino 20min', duration_seconds: 1200, total_sets: 7, total_reps: 0, total_weight: 0, effort_score: 3, exercises: [] } },
    ],
];

// ─── FAKE COMMENTS pool ───────────────────────────────────────────────────────
const COMMENT_POOL = [
    '¡Brutal! Sigue así 💪',
    'Eso es esfuerzo real 🔥',
    'Inspirador, gracias por compartir 🙏',
    'Yo también quiero llegar a ese nivel',
    '¿Cuánto tiempo llevas entrenando así?',
    'Me motivas un montón 🙌',
    'La constancia tiene su recompensa 🏆',
    'Qué buena sesión, envidia sana 😄',
    '¡Eso es lo que se llama dedicación!',
    '¡Grande! ¿Cuál es tu truco?',
    'Me has animado a entrenar hoy',
    'Top, así da gusto 🎯',
    'Semana a semana 💪💪',
    'Eres una máquina 🔥',
    '¡Lo flipas! Sigue currando',
    'Qué envidia más sana, chapó 👏',
    'El progreso está ahí aunque no siempre lo veamos',
    'Yo fui ayer y casi no puedo andar hoy jajaja',
    '¡Hay que verlo para creerlo! Increíble',
    'Hay que aprender de ti 🧠',
    'Qué crack, de verdad 🤩',
    'Yo llevo semanas sin ir y esto me ha dado el empujón',
    'Con esa actitud no se puede fallar 💯',
    'Mañana mismo me pongo las pilas 🏃',
    'Siempre tan constante, respeto total',
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🚀 MOVO Seed Script iniciado...\n');

    const createdUsers = [];

    for (let i = 0; i < FAKE_USERS.length; i++) {
        const u = FAKE_USERS[i];
        console.log(`👤 Creando usuario ${i + 1}/${FAKE_USERS.length}: ${u.full_name}...`);

        // 1. Create Supabase Auth user
        const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.full_name, avatar_url: u.avatar_url },
        });

        if (authErr) {
            if (authErr.message.includes('already been registered') || authErr.message.includes('already exists')) {
                console.log(`  ⚠️  Ya existe en Auth. Buscando en users...`);
                // Try to find existing public user row
                const { data: existing } = await supabase
                    .from('users')
                    .select('id, supabase_id')
                    .eq('email', u.email)
                    .maybeSingle();
                if (existing) {
                    createdUsers.push({ ...u, userId: existing.id, supabaseId: existing.supabase_id });
                    console.log(`  ✅ Recuperado: ${u.full_name}`);
                    continue;
                }
                // Not in public users — fetch Auth user to get their UUID and create the row
                console.log(`  🔧 No está en users. Recuperando de Auth...`);
                const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
                const authUser = authUsers.find((au) => au.email === u.email);
                if (!authUser) {
                    console.log(`  ❌ No encontrado en Auth tampoco. Saltando.`);
                    continue;
                }
                const supabaseId = authUser.id;
                const { data: publicUser, error: puErr } = await supabase
                    .from('users')
                    .insert({ email: u.email, full_name: u.full_name, avatar_url: u.avatar_url, role: u.role, supabase_id: supabaseId })
                    .select('id').single();
                if (puErr) { console.error(`  ❌ Error creando users row: ${puErr.message}`); continue; }
                const userId = publicUser.id;
                const { error: upErr } = await supabase.from('user_profiles').insert({ user_id: userId, ...u.profile, is_public: u.is_public });
                if (upErr) console.warn(`  ⚠️  user_profiles: ${upErr.message}`);
                createdUsers.push({ ...u, userId, supabaseId });
                console.log(`  ✅ Creado (recuperando Auth): ${u.full_name}`);
                continue;
            }
            console.error(`  ❌ Error Auth: ${authErr.message}`);
            continue;
        }

        const supabaseId = authData.user.id;

        // 2. Insert into public users table
        const { data: publicUser, error: puErr } = await supabase
            .from('users')
            .insert({
                email: u.email,
                full_name: u.full_name,
                avatar_url: u.avatar_url,
                role: u.role,
                supabase_id: supabaseId,
            })
            .select('id')
            .single();

        if (puErr) {
            console.error(`  ❌ Error inserting public user: ${puErr.message}`);
            continue;
        }

        const userId = publicUser.id;

        // 3. Insert user_profile
        const { error: upErr } = await supabase
            .from('user_profiles')
            .insert({
                user_id: userId,
                ...u.profile,
                is_public: u.is_public,
            });

        if (upErr) console.warn(`  ⚠️  user_profiles: ${upErr.message}`);

        createdUsers.push({ ...u, userId, supabaseId });
        console.log(`  ✅ Creado: ${u.full_name} (uid: ${supabaseId.slice(0, 8)}...)`);
    }

    console.log(`\n📝 Insertando posts en feed...\n`);

    // Insert feed posts
    for (let i = 0; i < createdUsers.length; i++) {
        const u = createdUsers[i];
        const userPosts = POSTS_PER_USER[i] ?? [];

        for (const post of userPosts) {
            const daysAgo = Math.floor(Math.random() * 30);
            const hoursAgo = Math.floor(Math.random() * 24);
            const created_at = new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000).toISOString();

            const { data: postRow, error } = await supabase.from('feed_posts').insert({
                supabase_uid: u.supabaseId,
                user_name: u.full_name,
                user_avatar: u.avatar_url,
                content: post.content,
                workout_data: post.workout_data,
                likes_count: Math.floor(Math.random() * 40),
                comments_count: 0,
                created_at,
            }).select('id').single();
            if (error) { console.warn(`  ⚠️  Post error: ${error.message}`); continue; }

            // Insert 1-4 fake comments from other already-created users
            const numComments = Math.floor(Math.random() * 4) + 1;
            const commentRows = [];
            const otherUsers = createdUsers.filter((cu) => cu.supabaseId !== u.supabaseId);
            for (let c = 0; c < numComments && otherUsers.length > 0; c++) {
                const commenter = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                const commentText = COMMENT_POOL[Math.floor(Math.random() * COMMENT_POOL.length)];
                const commentDaysAgo = Math.floor(Math.random() * daysAgo); // must be after the post
                const commentDate = new Date(Date.now() - commentDaysAgo * 86400000 - Math.floor(Math.random() * 3600000)).toISOString();
                commentRows.push({
                    post_id: postRow.id,
                    supabase_uid: commenter.supabaseId,
                    user_name: commenter.full_name,
                    user_avatar: commenter.avatar_url,
                    content: commentText,
                    created_at: commentDate,
                });
            }
            if (commentRows.length > 0) {
                const { error: cErr } = await supabase.from('feed_comments').insert(commentRows);
                if (cErr) console.warn(`  ⚠️  Comments error: ${cErr.message}`);
                else {
                    // Update comments_count on the post
                    await supabase.from('feed_posts').update({ comments_count: commentRows.length }).eq('id', postRow.id);
                }
            }
        }
        console.log(`  📝 ${userPosts.length} posts para ${u.full_name}`);
    }

    // Insert some follow relationships (public users only)
    console.log('\n🤝 Creando relaciones de seguimiento...\n');
    const publicUsers = createdUsers.filter((u) => u.is_public);
    const privateUsers = createdUsers.filter((u) => !u.is_public);

    // All public users follow each other (partial)
    const followPairs = [];
    for (let i = 0; i < publicUsers.length; i++) {
        for (let j = 0; j < publicUsers.length; j++) {
            if (i !== j && Math.random() > 0.4) {
                followPairs.push({ follower_id: publicUsers[i].userId, following_id: publicUsers[j].userId });
            }
        }
    }
    // Some follow private users (will become pending requests in the app)
    for (const pu of publicUsers.slice(0, 3)) {
        for (const priv of privateUsers) {
            // In the app follow requests are in follow_requests table; direct follows only for accepted
            // For seed purposes, we skip follow_requests insertion (keep everything clean)
        }
    }

    if (followPairs.length > 0) {
        const { error } = await supabase.from('user_follows').upsert(followPairs, { onConflict: 'follower_id,following_id', ignoreDuplicates: true });
        if (error) console.warn(`  ⚠️  Follows error: ${error.message}`);
        else console.log(`  ✅ ${followPairs.length} relaciones de seguimiento creadas`);
    }

    // ─── Workout Sessions ────────────────────────────────────────────
    console.log('\n🏋️  Generando sesiones de entrenamiento...\n');

    const ROUTINE_IDS = {
        gym:    ['11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003'],
        yoga:   ['22222222-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000003'],
        pilates:['33333333-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003'],
    };

    // How many sessions each user gets (mirrors their activity level)
    const SESSION_COUNTS = {
        beginner:     [10, 16],
        intermediate: [25, 38],
        advanced:     [45, 62],
    };

    function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

    function buildRoutinePool(preferredTypes) {
        const pool = [];
        for (const t of preferredTypes) {
            if (ROUTINE_IDS[t]) pool.push(...ROUTINE_IDS[t]);
        }
        return pool.length ? pool : ROUTINE_IDS.gym;
    }

    function generateSessions(userId, profile) {
        const [lo, hi] = SESSION_COUNTS[profile.activity_level] ?? SESSION_COUNTS.intermediate;
        const count = randInt(lo, hi);
        const routinePool = buildRoutinePool(profile.preferred_types);
        const isAdvanced = profile.activity_level === 'advanced';
        const isYogaPilates = profile.preferred_types.every(t => t !== 'gym');

        const sessions = [];
        // Spread sessions over the last 90 days (skew recent)
        const usedDays = new Set();
        for (let s = 0; s < count; s++) {
            // Pick a unique day within the last 90 days
            let daysAgo;
            let attempts = 0;
            do {
                daysAgo = randInt(0, 89);
                attempts++;
            } while (usedDays.has(daysAgo) && attempts < 200);
            usedDays.add(daysAgo);

            const startHour = randInt(6, 20);
            const started_at = new Date(Date.now() - daysAgo * 86400000 - (24 - startHour) * 3600000);

            const durationMin = isYogaPilates ? randInt(30, 60) : (isAdvanced ? randInt(55, 90) : randInt(35, 65));
            const caloriesPer = isAdvanced ? randInt(350, 620) : (isYogaPilates ? randInt(180, 320) : randInt(250, 420));
            const completed_at = new Date(started_at.getTime() + durationMin * 60000);
            const rating = randInt(3, 5);
            const routine_id = pick(routinePool);

            sessions.push({
                user_id: userId,
                routine_id,
                started_at: started_at.toISOString(),
                completed_at: completed_at.toISOString(),
                duration_minutes: durationMin,
                calories_burned: caloriesPer,
                rating,
            });
        }
        return sessions;
    }

    for (const u of createdUsers) {
        const sessions = generateSessions(u.userId, u.profile);
        // Insert in batches of 20 to avoid payload limits
        const BATCH = 20;
        let inserted = 0;
        for (let i = 0; i < sessions.length; i += BATCH) {
            const chunk = sessions.slice(i, i + BATCH);
            const { error } = await supabase.from('workout_sessions').insert(chunk);
            if (error) { console.warn(`  ⚠️  Sessions chunk error (${u.full_name}): ${error.message}`); break; }
            inserted += chunk.length;
        }
        console.log(`  💪 ${inserted} sesiones → ${u.full_name}`);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ SEED COMPLETADO');
    console.log('═══════════════════════════════════════════════');
    console.log(`\n📋 CUENTAS CREADAS:\n`);
    for (const u of createdUsers) {
        const privacy = u.is_public ? '🌐 público' : '🔒 privado';
        console.log(`  ${u.full_name} (${privacy})`);
        console.log(`    📧 ${u.email}`);
        console.log(`    🔑 ${u.password}`);
        console.log('');
    }
}

main().catch(console.error);
