---
name: "🚀 Deploy a Producción"
about: Checklist para promoción de Preview → Production (MoodMeterTec)
title: "Deploy a Producción — YYYY-MM-DD"
labels: deploy, production
assignees: ""
---

## 0) Pre-flight (entorno PRODUCTION)

- [ ] `DATABASE_URL` (PROD) configurada en Vercel
- [ ] `HASH_SALT`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://<tu-dominio>`
- [ ] `AZURE_AD_CLIENT_ID` / `AZURE_AD_CLIENT_SECRET` / `AZURE_AD_TENANT_ID`
- [ ] `SSO_ENABLED=1`
- [ ] Azure AD Redirect URI (PROD) creada: `/api/auth/callback/azure-ad`
- [ ] Migraciones listas: `npm run db:migrate`
- [ ] Seeds de catálogos: `npm run db:seed:catalogs` (sin PII)

## 1) Smoke en Preview (link al deployment)

Preview: https://<preview-url>

- [ ] `/api/health` → 200 `{status:"ok"}`
- [ ] Ruta matrícula (sin SSO) completa flujo
- [ ] SSO primera vez → vinculación → registro
- [ ] SSO ya vinculado → registro directo
- [ ] RLS: cuenta B no ve datos de A

## 2) Datos/Admin

- [ ] Agregados sin PII y umbral N≥5
- [ ] Export CSV válido (sin PII directa)
- [ ] Cron/follow-up (si aplica) operativo

## 3) CI verde en PR

- [ ] lint
- [ ] unit
- [ ] e2e (mocks)
- [ ] build

## 4) Deploy a PROD

- [ ] Variables PROD verificadas en Vercel
- [ ] Migraciones ejecutadas en PROD (manual/hook)
- [ ] Smoke en PROD: `/api/health`, `/register`, `/after`, `/mentor`, `/admin`
- [ ] Logs sin 5xx / latencia SSO aceptable

## 5) Rollback plan

- [ ] Confirmado: `SSO_ENABLED=0` desactiva SSO si es necesario
- [ ] Revert plan documentado

### Notas

- Evidencias/links:
- Riesgos:

