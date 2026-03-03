// Script para crear cuentas de prueba en Supabase
// Ejecutar: node create-test-users.mjs

const SUPABASE_URL = 'https://uyxysrodgxxduzyekgjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5eHlzcm9kZ3h4ZHV6eWVrZ2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMDM1MDIsImV4cCI6MjA4NzU3OTUwMn0.ZowFfmlcxgOnk_DFXDmQ3NmIUBTnsUpQFfCG3lrZgTw';

async function signUp(email, password, full_name, role) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
            email,
            password,
            data: { full_name, role },
        }),
    });
    const json = await res.json();
    if (json.error) {
        console.error(`❌ ${email}: ${json.error.message ?? json.error}`);
        return null;
    }
    const uid = json.user?.id ?? json.id;
    console.log(`✅ ${role.toUpperCase()} creado:`);
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UUID:     ${uid}`);
    console.log(`   Código:   ${uid?.slice(0, 8).toUpperCase()}`);
    console.log('');
    return uid;
}

async function upsertPublicUser(supabase_id, email, full_name, role) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ supabase_id, email, full_name, role }),
    });
    if (!res.ok) {
        const txt = await res.text();
        console.warn(`  ⚠️  upsert public.users: ${txt}`);
    }
}

(async () => {
    console.log('Creando cuentas de prueba MOVO...\n');

    const trainerUid = await signUp(
        'trainer.test@movo.com',
        'Movo1234!',
        'Jose Entrenador',
        'trainer'
    );
    if (trainerUid) await upsertPublicUser(trainerUid, 'trainer.test@movo.com', 'Jose Entrenador', 'trainer');

    const clientUid = await signUp(
        'cliente.test@movo.com',
        'Movo1234!',
        'Ana Cliente',
        'user'
    );
    if (clientUid) await upsertPublicUser(clientUid, 'cliente.test@movo.com', 'Ana Cliente', 'user');

    console.log('Listo. Usa estas credenciales en la app.');
})();
