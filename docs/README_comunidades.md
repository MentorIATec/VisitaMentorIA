## Comunidades, canal fijo y follow-up A (Fase 1.6)

### Migraciones y seeds
- Ejecuta migraciones:
  - `npm run db:migrate`
- Carga seeds:
  - `npm run db:seed`

Esto crea `communities` y agrega `community_id`, `channel` (default 'presencial') y `followup_variant` en `sessions`. También inserta 10 comunidades y la mentora Karen asociada a `talenta`.

### Registro (/register)
- Paso 1: selecciona comunidad (con badge de color), mentor/a, matrícula y consentimiento opcional.
- Canal está fijado a "presencial" (no se edita).
- Paso 2: motivo (o "Otro"), duración y valores BEFORE (placer/energía).
- Envía POST `/api/session` con `communityId` requerido; redirige a `/thanks`.

### Dashboards
- `/mentor` y `/admin` permiten filtrar por comunidad y muestran tarjetas por comunidad coloreadas con su `color`.
- `/admin` incluye exportación CSV anónima de agregados.

### Flags de follow-up
- Archivo: `public/config/flags.json`
```
{ "followup_enabled": true, "ab_test_after": "A" }
```
- El endpoint de sesión guarda `followup_variant='A'` cuando hay consentimiento (token generado) y el flag está presente.

### Cambiar variante A/B en el futuro
- Edita `public/config/flags.json`:
  - `"ab_test_after": "B"` para forzar B.
  - `"ab_test_after": "random"` (si se implementa lógica aleatoria futura).

### Accesibilidad y colores
- Los selectores usan etiquetas y contraste suficiente.
- El color de comunidad se usa en badges/series; al cambiar colores, edítalos en `communities` (DB) y vuelve a cargar la página.

### Notas de privacidad
- No se guarda PII directa; se hashea `matricula` en la base.
- No se registra PII en logs.


