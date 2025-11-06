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

    // Solo ejecutar seeds de catálogos (sin datos sensibles)
    const catalogSeeds = [
      '0001_reasons.sql',
      '0003_communities.sql'
    ];

    for (const fileName of catalogSeeds) {
      const full = path.join(seedsDir, fileName);
      if (!fs.existsSync(full)) {
        console.warn(`Advertencia: ${fileName} no existe, saltando...`);
        continue;
      }
      const sql = fs.readFileSync(full, 'utf8');
      console.log(`Ejecutando seed de catálogo: ${fileName}`);
      await client.query(sql);
    }

    console.log('Seeds de catálogos ejecutados correctamente.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

