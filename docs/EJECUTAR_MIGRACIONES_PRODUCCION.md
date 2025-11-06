# Ejecutar Migraciones y Seeds en Producción

## ⚠️ IMPORTANTE

**Asegúrate de estar conectado a la base de datos de PRODUCCIÓN antes de ejecutar estos comandos.**

## Paso 1: Configurar variables de entorno localmente

Crea un archivo `.env.production` (o usa variables de entorno directamente) con las credenciales de PRODUCCIÓN:

```bash
# En tu terminal, configura estas variables:
export DATABASE_URL="postgresql://postgres:<TU_PASSWORD>@db.nepfivhwbbpaulqcibsn.supabase.co:5432/postgres"
export HASH_SALT="<EL_MISMO_VALOR_QUE_CONFIGURASTE_EN_VERCEL>"
```

**⚠️ CRÍTICO:** Asegúrate de usar el mismo `HASH_SALT` que configuraste en Vercel, de lo contrario los hashes no coincidirán.

## Paso 2: Ejecutar migraciones

Las migraciones crean las tablas y estructura necesaria:

```bash
# Desde el directorio raíz del proyecto
npm run db:migrate
```

Esto ejecutará todas las migraciones en orden:
- `0003_create_communities.sql` - Crea tabla de comunidades
- `0004_sessions_community_fk_and_channel.sql` - Agrega FK y canal a sesiones
- `0005_followup_email_and_timestamp.sql` - Agrega campos de follow-up
- `0006_add_mood_intensity_and_note.sql` - Agrega intensidad y notas
- `0007_update_reasons_categories.sql` - Actualiza categorías de razones
- `0008_add_mentor_contact.sql` - Agrega campos de contacto a mentores
- `0009_remove_placeholder_mentors.sql` - Limpia mentores placeholder
- `0010_create_users_map.sql` - Crea tabla de vinculación SSO
- `0011_sessions_add_user_id_and_email_hash.sql` - Agrega campos SSO a sesiones

## Paso 3: Ejecutar seeds de catálogos

Los seeds de catálogos cargan datos iniciales (razones, comunidades):

```bash
npm run db:seed:catalogs
```

Esto ejecutará:
- `0001_reasons.sql` - Razones/categorías de emociones
- `0003_communities.sql` - Comunidades disponibles

## Paso 4: (Opcional) Cargar mentores

Si necesitas cargar los mentores, puedes ejecutar manualmente el seed de mentores:

```bash
# Opción 1: Usar el seed completo (si existe)
# Revisa db/seeds/0005_mentors_with_contact.sql

# Opción 2: Usar el script de procesamiento CSV
node scripts/process-csv-to-sql.js
# Esto generará SQL que puedes ejecutar manualmente en la DB
```

**Nota:** Los seeds de mentores contienen información sensible (emails, teléfonos), así que asegúrate de que sea seguro ejecutarlos en producción.

## Verificación

Después de ejecutar migraciones y seeds, verifica que todo esté correcto:

1. **Verifica tablas creadas:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Verifica comunidades:**
   ```sql
   SELECT * FROM public.communities;
   ```

3. **Verifica razones:**
   ```sql
   SELECT COUNT(*) FROM public.reasons;
   ```

4. **Verifica mentores (si los cargaste):**
   ```sql
   SELECT COUNT(*) FROM public.mentors;
   ```

## Troubleshooting

### Error: "DATABASE_URL no está definido"
- Asegúrate de haber exportado la variable `DATABASE_URL` en tu terminal
- O crea un archivo `.env.production` con las variables

### Error: "relation already exists"
- Algunas migraciones pueden haber sido ejecutadas parcialmente
- Revisa los logs para ver qué migración falló
- Puedes ejecutar las migraciones faltantes manualmente

### Error de conexión
- Verifica que la URL de conexión sea correcta
- Verifica que tu IP esté permitida en Supabase (Settings → Database → Connection Pooling)

## Comandos rápidos

```bash
# Configurar variables (reemplaza con tus valores reales)
export DATABASE_URL="postgresql://postgres:PASSWORD@db.nepfivhwbbpaulqcibsn.supabase.co:5432/postgres"
export HASH_SALT="TU_HASH_SALT_DE_VERCEL"

# Ejecutar migraciones
npm run db:migrate

# Ejecutar seeds de catálogos
npm run db:seed:catalogs
```

