## E2E sin base de datos (mocks)

Para ejecutar Playwright sin `DATABASE_URL`, el servidor se levanta con `E2E_MOCKS=1` y usa catálogos/almacenamiento efímero en memoria.

### Cómo correr

```bash
PORT=3001 npx playwright test
```

El `playwright.config.ts` ya exporta `E2E_MOCKS=1`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` y `HASH_SALT` dummies al `webServer`.

### Qué se mockea
- GET `/api/communities`, `/api/mentors`, `/api/reasons` devuelven catálogos estáticos.
- POST `/api/session` crea una sesión efímera en memoria y devuelve `sessionId`.
- POST `/api/after` acepta/crea token, marca `usedAt` y guarda el AFTER en memoria.
- Endpoints de soporte (solo con `E2E_MOCKS=1`):
  - GET `/api/test/last-followup-token` devuelve el último token generado.
  - POST `/api/test/seed-sessions` siembra sesiones rápidamente.

### Garantías
- En producción/dev normal NO se usan mocks (solo si `E2E_MOCKS==="1"`).
- Los datos se pierden al reiniciar.


