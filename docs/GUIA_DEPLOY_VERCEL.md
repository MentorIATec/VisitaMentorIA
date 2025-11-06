# Guía de Pruebas y Deploy en Vercel - MoodMeterTec

## 📋 Tabla de Contenidos

1. [Preparación Local](#1-preparación-local)
2. [Validación Pre-Deploy](#2-validación-pre-deploy)
3. [Configuración en Vercel](#3-configuración-en-vercel)
4. [Deploy a Preview](#4-deploy-a-preview)
5. [Smoke Tests en Preview](#5-smoke-tests-en-preview)
6. [Deploy a Producción](#6-deploy-a-producción)
7. [Post-Deploy](#7-post-deploy)

---

## 1. Preparación Local

### 1.1. Verificar rama y estado del código

```bash
# Asegúrate de estar en la rama correcta
git checkout main  # o la rama que quieras desplegar
git pull origin main

# Verifica que no hay cambios sin commitear
git status
```

### 1.2. Instalar dependencias

```bash
# Instalar dependencias (usa --legacy-peer-deps si hay conflictos)
npm ci
# O si hay conflictos de peer dependencies:
npm ci --legacy-peer-deps
```

### 1.3. Generar secretos necesarios

```bash
# Generar HASH_SALT
openssl rand -base64 32

# Generar NEXTAUTH_SECRET
openssl rand -base64 32

# Guarda estos valores, los necesitarás para Vercel
```

---

## 2. Validación Pre-Deploy

Ejecuta estos comandos en orden para validar que todo funciona:

### 2.1. Lint y Type Check

```bash
# Verificar código con ESLint
npm run lint

# Verificar tipos con TypeScript
npm run typecheck
```

### 2.2. Tests Unitarios

```bash
# Ejecutar tests unitarios (modo producción, sin watch)
npm run test -- --run
```

### 2.3. Tests E2E (con mocks)

```bash
# Tests E2E con mocks (no requiere DB real)
PORT=3001 E2E_MOCKS=1 npx playwright test
```

### 2.4. Build de Producción

```bash
# Verificar que el build funciona correctamente
npm run build

# Probar el servidor de producción localmente
npm run start
# O en puerto alterno:
PORT=3001 npm run start
```

**Verifica manualmente:**
- Abre `http://localhost:3000` (o el puerto que uses)
- Navega por las rutas principales: `/`, `/register`, `/mentor`, `/admin`
- Verifica que no hay errores en la consola del navegador

---

## 3. Configuración en Vercel

### 3.1. Crear/Conectar Proyecto

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..."** → **"Project"**
3. Conecta tu repositorio de GitHub
4. Configuración del proyecto:
   - **Framework Preset**: Next.js (detectado automáticamente)
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `npm run build` (o dejar vacío, Next.js lo detecta)
   - **Output Directory**: `.next` (automático para Next.js)
   - **Install Command**: `npm ci` (o `npm ci --legacy-peer-deps` si hay conflictos)
   - **Node.js Version**: `20` (LTS)

### 3.2. Configurar Variables de Entorno

Ve a **Settings** → **Environment Variables** y agrega:

#### Variables Requeridas (para Preview y Production)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de conexión PostgreSQL | `postgres://user:pass@host:5432/dbname` |
| `HASH_SALT` | Salt para hashing (generado con openssl) | `[valor generado]` |
| `NEXTAUTH_SECRET` | Secreto para NextAuth (generado con openssl) | `[valor generado]` |
| `NEXTAUTH_URL` | URL pública de la app | `https://tu-proyecto.vercel.app` |

**Para Preview:**
- `NEXTAUTH_URL` = `https://tu-proyecto-git-branch-tu-usuario.vercel.app`
- Selecciona **"Preview"** en el selector de entornos

**Para Production:**
- `NEXTAUTH_URL` = `https://tu-dominio.com` (o el dominio de Vercel)
- Selecciona **"Production"** en el selector de entornos

#### Variables Opcionales para SSO (si aplica)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SSO_ENABLED` | Activar SSO (`1` o `0`) | `1` |
| `AZURE_AD_CLIENT_ID` | Client ID de Azure AD | `[de Azure Portal]` |
| `AZURE_AD_CLIENT_SECRET` | Client Secret de Azure AD | `[de Azure Portal]` |
| `AZURE_AD_TENANT_ID` | Tenant ID de Azure AD | `[de Azure Portal]` |
| `AZURE_AD_DOMAIN_ALLOWLIST` | Dominios permitidos (separados por coma) | `tec.mx,itesm.mx` |

**Importante:** Configura estas variables tanto para **Preview** como para **Production**.

### 3.3. Configurar Azure AD (si usas SSO)

1. Ve a [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Selecciona tu aplicación (o créala si no existe)
3. Ve a **Authentication** → **Add a platform** → **Web**
4. Agrega Redirect URIs:
   - **Preview**: `https://tu-proyecto-*-*.vercel.app/api/auth/callback/azure-ad`
   - **Production**: `https://tu-dominio.com/api/auth/callback/azure-ad`
5. Guarda los cambios

---

## 4. Deploy a Preview

### 4.1. Crear Pull Request

```bash
# Crear una rama nueva para tus cambios
git checkout -b feature/mi-feature

# Hacer commit de tus cambios
git add .
git commit -m "Descripción de cambios"

# Push a GitHub
git push origin feature/mi-feature
```

1. Ve a GitHub y crea un **Pull Request** hacia `main`
2. Vercel automáticamente creará un **Preview Deployment**
3. Espera a que el build termine (verás el estado en el PR)

### 4.2. Verificar Build en Vercel

1. Ve al dashboard de Vercel
2. Verifica que el deployment de Preview está **Ready**
3. Si hay errores, revisa los logs en Vercel

### 4.3. Ejecutar Migraciones en Preview

**IMPORTANTE:** Las migraciones NO se ejecutan automáticamente. Debes hacerlo manualmente.

```bash
# Configurar variables de entorno localmente para la DB de Preview
export DATABASE_URL="postgres://user:pass@host:5432/preview_db"
export HASH_SALT="salt-de-preview"

# Ejecutar migraciones
npm run db:migrate

# Ejecutar seeds de catálogos (solo catálogos, sin PII)
npm run db:seed:catalogs
```

**Nota:** Asegúrate de tener acceso a la base de datos de Preview desde tu máquina local.

---

## 5. Smoke Tests en Preview

Una vez que el Preview está desplegado, ejecuta estos tests:

### 5.1. Health Check

```bash
# Verificar que el health endpoint funciona
curl https://tu-preview-url.vercel.app/api/health

# Debe retornar: {"status":"ok","time":"...","version":"..."}
```

O abre en el navegador: `https://tu-preview-url.vercel.app/api/health`

### 5.2. Flujos Principales

**A. Ruta por Matrícula (sin SSO):**
1. Abre `https://tu-preview-url.vercel.app/`
2. Ingresa una matrícula válida
3. Completa el flujo de registro
4. Verifica que llegas a `/thanks`

**B. SSO Primera Vez (si está habilitado):**
1. Abre en modo incógnito
2. Click en "Continuar con Microsoft"
3. Login con cuenta Tec
4. Debe pedirte vincular matrícula
5. Ingresa matrícula y completa el registro

**C. SSO Ya Vinculado:**
1. En otro navegador/incógnito, repite login SSO
2. Debe saltar el paso de vinculación
3. Debe permitir registro directo

**D. RLS (Row Level Security):**
1. Con cuenta A, crea 1-2 registros
2. Con cuenta B (distinta), verifica que NO ve los registros de A
3. Si hay vista `/admin`, verifica agregados sin PII

### 5.3. Validación Técnica

```bash
# Verificar headers de seguridad
curl -I https://tu-preview-url.vercel.app/

# Debe incluir:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

### 5.4. Checklist de Preview

- [ ] `/api/health` → 200 OK
- [ ] `/` → Carga correctamente
- [ ] `/register` → Flujo completo funciona
- [ ] `/after` → Accesible después de registro
- [ ] `/mentor` → Lista mentores correctamente
- [ ] `/admin` → (Si existe) Muestra datos agregados
- [ ] SSO funciona (si está habilitado)
- [ ] RLS funciona correctamente
- [ ] No hay errores en consola del navegador
- [ ] No hay errores 5xx en logs de Vercel

---

## 6. Deploy a Producción

### 6.1. Verificar CI/CD

Antes de hacer merge, verifica que todos los checks de GitHub Actions pasen:

- [ ] **lint** → ✅
- [ ] **typecheck** → ✅
- [ ] **unit** → ✅
- [ ] **e2e-mocks** → ✅
- [ ] **build** → ✅

### 6.2. Merge a Main

```bash
# Una vez que todos los checks pasen, hacer merge del PR
# (Esto se hace desde GitHub UI o con git)
```

O promover manualmente desde Vercel Dashboard:
1. Ve al deployment de Preview
2. Click en **"..."** → **"Promote to Production"**

### 6.3. Ejecutar Migraciones en Producción

**CRÍTICO:** Ejecuta migraciones ANTES de que usuarios accedan a la app.

```bash
# Configurar variables para DB de Producción
export DATABASE_URL="postgres://user:pass@host:5432/prod_db"
export HASH_SALT="salt-de-produccion"

# Ejecutar migraciones
npm run db:migrate

# Ejecutar seeds de catálogos (solo si es necesario)
npm run db:seed:catalogs
```

**⚠️ ADVERTENCIA:** Asegúrate de estar conectado a la DB de PRODUCCIÓN correcta.

### 6.4. Verificar Variables de Entorno en Producción

1. Ve a Vercel → Tu Proyecto → **Settings** → **Environment Variables**
2. Verifica que todas las variables de **Production** están configuradas:
   - `DATABASE_URL` (PROD)
   - `HASH_SALT` (PROD)
   - `NEXTAUTH_SECRET` (PROD)
   - `NEXTAUTH_URL` (dominio de producción)
   - Variables de SSO (si aplica)

---

## 7. Post-Deploy

### 7.1. Smoke Tests en Producción

Repite los mismos tests que en Preview, pero en producción:

```bash
# Health check
curl https://tu-dominio.com/api/health

# Verificar headers
curl -I https://tu-dominio.com/
```

**Checklist de Producción:**
- [ ] `/api/health` → 200 OK
- [ ] `/` → Carga correctamente
- [ ] `/register` → Flujo completo funciona
- [ ] `/after` → Accesible
- [ ] `/mentor` → Funciona
- [ ] `/admin` → (Si existe) Funciona
- [ ] SSO funciona (si está habilitado)
- [ ] No hay errores en logs de Vercel

### 7.2. Monitoreo

1. **Vercel Analytics:**
   - Ve a **Analytics** en Vercel Dashboard
   - Revisa métricas de rendimiento
   - Verifica que no hay picos de errores

2. **Logs de Vercel:**
   - Ve a **Deployments** → Selecciona el deployment de producción
   - Revisa **Logs** para errores 5xx
   - Verifica latencia del SSO (normalmente 300-800ms adicionales)

3. **Base de Datos:**
   - Revisa métricas de tu proveedor de DB
   - Verifica conexiones activas
   - Revisa queries lentas (si tu proveedor lo permite)

### 7.3. Rollback Plan

Si algo sale mal:

**Opción 1: Desactivar SSO temporalmente**
```bash
# En Vercel, cambiar SSO_ENABLED=0 y redeploy
```

**Opción 2: Revertir Deployment**
1. Ve a Vercel → Deployments
2. Selecciona el deployment anterior (que funcionaba)
3. Click en **"..."** → **"Promote to Production"**

**Opción 3: Revertir Git**
```bash
# Revertir el commit problemático
git revert <commit-hash>
git push origin main
```

---

## 🔧 Troubleshooting

### Build Falla en Vercel

1. Revisa los logs del build en Vercel
2. Verifica que `package.json` tiene todas las dependencias
3. Si hay conflictos de peer dependencies, usa `npm ci --legacy-peer-deps` en Install Command

### Migraciones Fallan

1. Verifica que `DATABASE_URL` es correcta
2. Verifica que tienes permisos en la DB
3. Revisa los logs de migración
4. Verifica que la estructura de migraciones es correcta

### SSO No Funciona

1. Verifica Redirect URIs en Azure AD
2. Verifica que `SSO_ENABLED=1` está configurado
3. Verifica que `NEXTAUTH_URL` coincide con el dominio
4. Revisa logs de NextAuth en Vercel

### Health Endpoint Retorna Error

1. Verifica que la DB está accesible
2. Revisa logs de Vercel para errores específicos
3. Verifica variables de entorno

---

## 📝 Notas Adicionales

- **Ignored Build Step:** Configura en Vercel Settings → Git → Ignored Build Step para evitar builds innecesarios cuando solo cambian docs/tests
- **Deploy Hooks:** Puedes automatizar migraciones con Vercel Deploy Hooks y GitHub Actions
- **Dominio Personalizado:** Configura dominio personalizado en Vercel → Settings → Domains

---

## ✅ Checklist Final

Antes de considerar el deploy completo:

- [ ] Todos los tests pasan localmente
- [ ] Build funciona localmente
- [ ] Variables de entorno configuradas en Vercel (Preview y Production)
- [ ] Migraciones ejecutadas en Preview
- [ ] Smoke tests pasan en Preview
- [ ] CI/CD verde en GitHub
- [ ] Migraciones ejecutadas en Production
- [ ] Smoke tests pasan en Production
- [ ] Logs sin errores críticos
- [ ] Monitoreo configurado

---

**¡Listo!** Tu aplicación debería estar funcionando en Vercel. 🚀

