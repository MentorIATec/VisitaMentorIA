# Ejecutar Seed de Mentores en Producción

## ⚠️ IMPORTANTE

El seed de mentores contiene información de contacto (WhatsApp, Instagram). Asegúrate de que sea seguro ejecutarlo en producción.

## Paso 1: Verificar que la migración de contacto se ejecutó

Antes de ejecutar el seed de mentores, asegúrate de que la migración `0008_add_mentor_contact.sql` se haya ejecutado correctamente:

```sql
-- Verificar que la tabla tiene las columnas necesarias
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mentors' 
AND column_name IN ('whatsapp', 'instagram');
```

## Paso 2: Ejecutar el seed de mentores

Tienes dos opciones:

### Opción A: Ejecutar directamente el SQL

Conéctate a tu base de datos de producción y ejecuta el contenido de `db/seeds/0005_mentors_with_contact.sql`:

```bash
# Desde tu terminal, con DATABASE_URL configurado:
export DATABASE_URL="postgresql://postgres:<TU_PASSWORD>@db.nepfivhwbbpaulqcibsn.supabase.co:5432/postgres"

# Ejecutar el SQL directamente
psql $DATABASE_URL -f db/seeds/0005_mentors_with_contact.sql
```

### Opción B: Usar Node.js con el script

Puedes crear un script temporal o ejecutar directamente:

```bash
# Configurar variables
export DATABASE_URL="postgresql://postgres:<TU_PASSWORD>@db.nepfivhwbbpaulqcibsn.supabase.co:5432/postgres"
export HASH_SALT="<TU_HASH_SALT>"

# Ejecutar con Node.js
node -e "
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => {
    const sql = fs.readFileSync(path.join(__dirname, 'db/seeds/0005_mentors_with_contact.sql'), 'utf8');
    return client.query(sql);
  })
  .then(() => {
    console.log('Seed de mentores ejecutado correctamente');
    client.end();
  })
  .catch(err => {
    console.error('Error:', err);
    client.end();
    process.exit(1);
  });
"
```

## Paso 3: Verificar que los mentores se cargaron

```sql
-- Verificar cantidad de mentores
SELECT COUNT(*) FROM public.mentors;

-- Ver algunos mentores
SELECT email, display_name, comunidad_id, whatsapp 
FROM public.mentors 
LIMIT 5;
```

## Nota sobre duplicados

Si ejecutas el seed múltiples veces, puede haber errores de duplicados. Si es necesario, puedes limpiar primero:

```sql
-- ⚠️ CUIDADO: Esto elimina TODOS los mentores
DELETE FROM public.mentors;
```

Luego ejecuta el seed nuevamente.

