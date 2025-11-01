## CI

La CI ejecuta lint, unit y e2e con mocks.

- Workflow: `.github/workflows/ci.yml`
- Node 20, `npm ci`
- Lint: `npm run lint`
- Unit: `npx vitest run`
- E2E: `npx playwright test` con env:
  - `E2E_MOCKS=1`
  - `NEXTAUTH_SECRET=ci_dev_secret`
  - `HASH_SALT=ci_hash_salt`
  - `NEXTAUTH_URL=http://localhost:3001`
  - `PORT=3001`

Los E2E usan endpoints de prueba (`/api/test/*`) y no requieren base de datos.


