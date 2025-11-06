#!/usr/bin/env node
/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const dotenv = require('dotenv');

// Cargar .env.local y luego .env como respaldo
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL no está definido.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const seedsDir = path.resolve(process.cwd(), 'db', 'seeds');
    const seedFile = path.join(seedsDir, '0005_mentors_with_contact.sql');
    
    if (!fs.existsSync(seedFile)) {
      console.error(`Archivo no encontrado: ${seedFile}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(seedFile, 'utf8');
    console.log('Ejecutando seed de mentores...');
    await client.query(sql);
    console.log('✅ Seed de mentores ejecutado correctamente.');
    
    // Verificar cantidad de mentores
    const countRes = await client.query('SELECT COUNT(*) FROM public.mentors');
    console.log(`📊 Total de mentores en la base de datos: ${countRes.rows[0].count}`);
  } catch (err) {
    console.error('❌ Error ejecutando seed:', err.message);
    if (err.code === '23505') {
      console.log('💡 Algunos mentores ya existen. El seed usa ON CONFLICT, así que se actualizaron los datos existentes.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

