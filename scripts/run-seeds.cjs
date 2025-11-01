#!/usr/bin/env node
/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Cargar .env.local y luego .env como respaldo
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

function sqlLiteral(val) {
  return `'${String(val ?? '').replace(/'/g, "''")}'`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const hashSalt = process.env.HASH_SALT || '';
  if (!databaseUrl) {
    console.error('DATABASE_URL no está definido.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    // Evitar parámetros bind aquí y usar literal escapado
    const setCfg = `SELECT set_config('app.hash_salt', ${sqlLiteral(hashSalt)}, false);`;
    await client.query(setCfg);

    const seedsDir = path.resolve(process.cwd(), 'db', 'seeds');
    if (!fs.existsSync(seedsDir)) {
      console.log('No hay carpeta de seeds, nada que ejecutar.');
      return;
    }

    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const full = path.join(seedsDir, file);
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`Ejecutando seed: ${file}`);
      await client.query(sql);
    }

    console.log('Seeds ejecutados correctamente.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
