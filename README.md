This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# MoodMeterTec

## Ejecutar en puerto alterno

Si el puerto 3000 está ocupado:

```bash
PORT=3001 npm run start
```

Para matar procesos que usen el 3000 (macOS):

```bash
lsof -i :3000
kill -9 <PID>
```

## E2E con Playwright

El runner usa `PORT` si está definido. Ejemplos:

```bash
PORT=3001 npx playwright test
```

## Tests

### Unitarios (Vitest)

```bash
npm run test
```

Ejecuta tests unitarios en modo watch. Para producción:

```bash
npm run test -- --run
```

### E2E (Playwright)

```bash
npm run test:e2e
```

Los tests E2E usan mocks automáticamente cuando `E2E_MOCKS=1` está configurado.

## Deploy

### Pre-requisitos

1. **Base de datos PostgreSQL gestionada** (Neon, Supabase, Railway, etc.)
   - Crear una base de datos nueva
   - Obtener la URL de conexión (formato: `postgres://USER:PASSWORD@HOST:PORT/DATABASE`)
   - Guardar la URL para configurarla en Vercel

2. **Variables de entorno locales** (desarrollo)
   - Copiar `.env.example` a `.env.local`
   - Configurar todas las variables con valores de desarrollo

### Configuración de Variables de Entorno

#### Variables Requeridas

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `HASH_SALT`: Salt para hashing (generar con `openssl rand -base64 32`)
- `NEXTAUTH_SECRET`: Secreto para NextAuth (generar con `openssl rand -base64 32`)
- `NEXTAUTH_URL`: URL pública de la aplicación
- `E2E_MOCKS`: (Opcional) Solo para tests E2E locales, usar `"1"` para activar

#### Variables Opcionales para SSO

- `SSO_ENABLED`: Activar SSO con Azure AD (`true` o `false`, por defecto `false`)
- `AZURE_AD_CLIENT_ID`: Client ID de la aplicación Azure AD
- `AZURE_AD_CLIENT_SECRET`: Client Secret de la aplicación Azure AD
- `AZURE_AD_TENANT_ID`: Tenant ID de Azure AD (opcional, se puede usar tenant común)
- `AZURE_AD_DOMAIN_ALLOWLIST`: Dominios permitidos separados por coma (ej: `tec.mx,itesm.mx`)
- `E2E_SSO_MOCK`: (Opcional) Para tests E2E con mocks SSO, usar `"1"` para activar

#### Configuración en Vercel

1. **Crear proyecto en Vercel**
   - Conectar el repositorio de GitHub
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next` (automático para Next.js)
   - Install Command: `npm ci`
   - Node.js Version: `20` (LTS)

2. **Configurar variables de entorno por entorno**

   **Preview** (para PRs y branches):
   - Ir a Settings → Environment Variables
   - Agregar cada variable con valores de Preview:
     - `DATABASE_URL` (DB de preview)
     - `HASH_SALT` (valor único para preview)
     - `NEXTAUTH_SECRET` (valor único para preview)
     - `NEXTAUTH_URL` (URL de preview de Vercel)
   - Seleccionar "Preview" en el selector de entornos

   **Production**:
   - Agregar las mismas variables con valores de producción
   - Seleccionar "Production" en el selector de entornos

### Migraciones de Base de Datos

#### Opción Manual (Recomendada)

Después de cada deploy (Preview o Production):

1. Configurar `DATABASE_URL` localmente apuntando a la DB del entorno:
   ```bash
   export DATABASE_URL="postgres://USER:PASS@HOST:PORT/DB"
   export HASH_SALT="salt-del-entorno"
   ```

2. Ejecutar migraciones:
   ```bash
   npm run db:migrate
   ```

3. Verificar que las migraciones se aplicaron correctamente (revisar logs)

**Nota**: No ejecutar migraciones durante el build de Vercel. Ejecutarlas manualmente después del deploy.

#### Opción Automática (Hook - Avanzado)

Si prefieres automatizar las migraciones:

1. Crear un Vercel Deploy Hook en Settings → Deploy Hooks
2. Configurar un GitHub Action que escuche el hook
3. Ejecutar `npm run db:migrate` contra la DB del entorno correspondiente

**Nota**: Esta opción requiere configuración adicional de secretos y acceso a la DB desde GitHub Actions.

### Seeds de Catálogos

Los seeds de catálogos (razones, comunidades) se ejecutan solo cuando sea necesario:

```bash
npm run db:seed:catalogs
```

**Importante**: Este comando solo ejecuta seeds de catálogos (sin datos sensibles). No ejecutar seeds de usuarios o datos de producción.

### Comandos Locales de Verificación

Antes de hacer deploy, verificar localmente:

```bash
# Validación rápida (lint + typecheck + tests unitarios)
npm run validate

# Validación completa (incluye build)
npm run validate:full

# Tests E2E con mocks (no requiere DB)
PORT=3001 npm run test:e2e:mocks

# Build y start
npm run build && npm run start
```

**📖 Para una guía completa paso a paso, consulta [GUIA_DEPLOY_VERCEL.md](./docs/GUIA_DEPLOY_VERCEL.md)**

### Primer Deploy

1. **Hacer push a una rama** (no directamente a `main`)
2. **Crear Pull Request** → Vercel creará automáticamente un Preview
3. **Verificar Preview**:
   - Revisar que el build pasó en Vercel
   - Verificar que el health endpoint funciona: `https://preview-url.vercel.app/api/health`
   - Ejecutar migraciones manualmente contra la DB de Preview
   - Ejecutar seeds de catálogos: `npm run db:seed:catalogs`
   - Hacer smoke tests (ver checklist abajo)

4. **Promover a Production**:
   - Una vez verificado Preview, hacer merge a `main`
   - O promover manualmente desde el dashboard de Vercel
   - Ejecutar migraciones manualmente contra la DB de Production
   - Ejecutar seeds de catálogos si es necesario
   - Hacer smoke tests en Production

### Post-Deploy Checklist

Después de cada deploy, verificar:

- [ ] **Health endpoint**: `GET /api/health` → 200 + `{status:"ok", time, version}`
- [ ] **Registro**: `GET /register` → carga correctamente y valida matrícula
- [ ] **After**: `GET /after` → accesible tras completar flujo de registro
- [ ] **Mentor**: `GET /mentor` → lista mentores con filtros/chips funcionando
- [ ] **Admin**: `GET /admin` → tabla de datos y descarga CSV funcionando
- [ ] **Cron/Follow-up**: (Si aplica) verificar logs en Vercel, ejecución correcta

### Ignored Build Step (Optimización Opcional)

Para evitar builds innecesarios cuando solo cambian archivos no relevantes (docs, tests, etc.), configurar en Vercel Settings → Git → Ignored Build Step:

```bash
git diff HEAD^ HEAD --quiet -- app/ components/ lib/ package.json package-lock.json next.config.js next.config.mjs
```

Este script retorna 0 (skip build) si no hay cambios en archivos relevantes, o 1 (build) si hay cambios.

### CI/CD (GitHub Actions)

El workflow `.github/workflows/ci.yml` ejecuta automáticamente en cada PR:

- **lint**: Verifica código con ESLint
- **typecheck**: Verifica tipos con TypeScript
- **unit**: Ejecuta tests unitarios con Vitest
- **e2e-mocks**: Ejecuta tests E2E con `E2E_MOCKS=1` (sin DB real)
- **build**: Verifica que el build de Next.js funciona

Todos los jobs deben pasar (verde) antes de hacer merge.

## SSO Híbrido con Azure AD

### Configuración

El sistema soporta autenticación híbrida: usuarios pueden iniciar sesión con Microsoft (Azure AD) o usar su matrícula directamente.

#### Pasos para Registrar App en Azure AD

1. **Crear App Registration en Azure Portal**
   - Ir a [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
   - Click en "New registration"
   - Nombre: `MoodMeterTec` (o el nombre que prefieras)
   - Supported account types: "Accounts in this organizational directory only" o "Accounts in any organizational directory"
   - Redirect URI: `Web` → `https://tu-dominio.com/api/auth/callback/azure-ad`

2. **Configurar Authentication**
   - En la app recién creada, ir a "Authentication"
   - Agregar redirect URI para producción y preview (si aplica)
   - Habilitar "ID tokens" en Implicit grant and hybrid flows

3. **Obtener Credenciales**
   - Ir a "Overview" → copiar "Application (client) ID" → `AZURE_AD_CLIENT_ID`
   - Ir a "Certificates & secrets" → crear nuevo client secret → copiar valor → `AZURE_AD_CLIENT_SECRET`
   - Copiar "Directory (tenant) ID" → `AZURE_AD_TENANT_ID` (opcional)

4. **Configurar Dominios Permitidos**
   - En "Token configuration" → "Optional claims" → agregar email claim
   - Configurar `AZURE_AD_DOMAIN_ALLOWLIST` con dominios permitidos (ej: `tec.mx,itesm.mx`)

5. **Activar SSO**
   - Configurar `SSO_ENABLED=true` en variables de entorno
   - Configurar `NEXT_PUBLIC_SSO_ENABLED=true` para el frontend (o usar variable de entorno pública)

### Flujo de Usuario

1. **Primera vez con SSO**: Usuario hace login con Microsoft → se redirige a `/register?link=1` → ingresa matrícula → se vincula → continúa con registro
2. **SSO ya vinculado**: Usuario hace login con Microsoft → va directamente a `/register` (sin pedir matrícula nuevamente)
3. **Ruta matrícula**: Usuario ingresa matrícula directamente (sin SSO) → funciona igual que antes

### Privacidad y Protección de Datos

- **Tabla `users_map`**: Almacena la vinculación entre `user_id` (sub de Azure AD) y `matricula_hash` (hash de matrícula)
- **Columnas opcionales en `sessions`**: 
  - `user_id`: ID del usuario SSO (si aplica)
  - `email_hash`: Hash del email para análisis agregado
- **RLS (Row Level Security)**: Los usuarios solo pueden ver sus propias sesiones usando `user_id` o `matricula_hash`

### Dashboard y Vistas Agregadas

- Las vistas agregadas en dashboards usan **k-anonimato** (mínimo k registros por grupo)
- No se expone PII (Personally Identifiable Information) en dashboards
- Solo roles `admin` y `mentor` tienen acceso a dashboards
- Los datos se agregan antes de mostrarse para proteger privacidad individual
