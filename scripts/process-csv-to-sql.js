// Script para procesar DATOSME_CURSOR.csv y generar SQL seeds
const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'DATOSME_CURSOR.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

const lines = csvContent.split('\n');
const headers = lines[0].split(',');
const data = [];

// Procesar líneas del CSV
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Manejar valores con comillas y saltos de línea
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  if (values.length >= headers.length) {
    data.push({
      comunidad: values[0],
      hex: values[1],
      nombreMentor: values[2],
      nickname: values[3],
      fotoMentor: values[4],
      email: values[5]?.trim(),
      whatsapp: values[6],
      instagram: values[7]
    });
  }
}

// Extraer comunidades únicas
const comunidadesMap = new Map();
data.forEach(row => {
  if (row.comunidad && row.hex) {
    // Normalizar nombre de comunidad a minúsculas para el code
    const code = row.comunidad.toLowerCase();
    // Usar el primer color que encontremos para cada comunidad (normalizar Energio)
    const color = row.hex.startsWith('#') ? row.hex : `#${row.hex}`;
    if (!comunidadesMap.has(code)) {
      comunidadesMap.set(code, {
        code,
        name: row.comunidad,
        color: color.toUpperCase()
      });
    }
  }
});

// Generar SQL para comunidades
let comunidadesSQL = `-- Seed de comunidades desde DATOSME_CURSOR.csv\n`;
comunidadesSQL += `INSERT INTO public.communities (code, name, color)\nVALUES\n`;
const comunidadesArray = Array.from(comunidadesMap.values());
comunidadesSQL += comunidadesArray.map((c, idx) => {
  const comma = idx < comunidadesArray.length - 1 ? ',' : '';
  return `  ('${c.code}', '${c.name}', '${c.color}')${comma}`;
}).join('\n');
comunidadesSQL += '\nON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, active = true;\n\n';

// Generar SQL para mentores
let mentorsSQL = `-- Seed de mentores desde DATOSME_CURSOR.csv\n`;
mentorsSQL += `INSERT INTO public.mentors (email, display_name, campus, comunidad_id, whatsapp, instagram)\nVALUES\n`;

const mentorsArray = data
  .filter(row => row.email && row.nombreMentor)
  .map((row, idx) => {
    const code = row.comunidad.toLowerCase();
    const email = row.email.replace(/\s+/g, ''); // Limpiar espacios
    const displayName = row.nombreMentor.replace(/'/g, "''"); // Escapar comillas
    const whatsapp = row.whatsapp || null;
    const instagram = row.instagram || null;
    const comma = idx < data.filter(r => r.email && r.nombreMentor).length - 1 ? ',' : '';
    
    // Verificar si la columna whatsapp e instagram existen, si no, no incluir
    return `  ('${email}', '${displayName}', 'MTY', '${code.toUpperCase()}', ${whatsapp ? `'${whatsapp}'` : 'NULL'}, ${instagram ? `'${instagram}'` : 'NULL'})${comma}`;
  });

mentorsSQL += mentorsArray.join('\n');
mentorsSQL += '\nON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, campus = EXCLUDED.campus, comunidad_id = EXCLUDED.comunidad_id, whatsapp = EXCLUDED.whatsapp, instagram = EXCLUDED.instagram;\n';

// Escribir archivos
const outputDir = path.join(__dirname, '..', 'db', 'seeds');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outputDir, '0003_communities.sql'),
  comunidadesSQL
);

// Verificar si la tabla tiene columnas whatsapp e instagram
// Por ahora, generar sin ellas si no existen
const mentorsSQLSimple = `-- Seed de mentores desde DATOSME_CURSOR.csv\n`;
const mentorsSQLSimpleContent = `INSERT INTO public.mentors (email, display_name, campus, comunidad_id)\nVALUES\n` +
  data
    .filter(row => row.email && row.nombreMentor)
    .map((row, idx, arr) => {
      const code = row.comunidad.toLowerCase();
      const email = row.email.replace(/\s+/g, '');
      const displayName = row.nombreMentor.replace(/'/g, "''");
      const comma = idx < arr.length - 1 ? ',' : '';
      return `  ('${email}', '${displayName}', 'MTY', '${code.toUpperCase()}')${comma}`;
    }).join('\n') +
  '\nON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name, campus = EXCLUDED.campus, comunidad_id = EXCLUDED.comunidad_id;\n';

fs.writeFileSync(
  path.join(outputDir, '0004_mentors_complete.sql'),
  mentorsSQLSimpleContent
);

console.log('✅ SQL generado exitosamente:');
console.log('  - db/seeds/0003_communities.sql');
console.log('  - db/seeds/0004_mentors_complete.sql');
console.log(`\n📊 Estadísticas:`);
console.log(`  - Comunidades: ${comunidadesArray.length}`);
console.log(`  - Mentores: ${data.filter(r => r.email && r.nombreMentor).length}`);

