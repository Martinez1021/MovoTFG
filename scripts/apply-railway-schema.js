// ─── Ejecuta railway-schema.sql en Railway PostgreSQL ──────────────────────
// Uso: node scripts/apply-railway-schema.js <PUBLIC_URL>
// Ejemplo: node scripts/apply-railway-schema.js "postgresql://postgres:PASS@roundhouse.proxy.rlwy.net:12345/railway"

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.argv[2];
if (!url) {
  console.error('❌ Falta la URL pública de Railway Postgres.');
  console.error('   Uso: node scripts/apply-railway-schema.js "<URL>"');
  console.error('   Obtenla en: Railway → Postgres → Settings → Networking → TCP Proxy');
  process.exit(1);
}

const sqlPath = path.join(__dirname, '..', 'railway-schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando a Railway PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado. Ejecutando schema...');
    await client.query(sql);
    console.log('✅ Schema aplicado correctamente.');
    console.log('   · 8 tablas creadas');
    console.log('   · 6 índices creados');
    console.log('   · 9 rutinas + ~40 ejercicios insertados');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
