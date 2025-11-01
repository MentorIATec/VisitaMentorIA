# Changelog - Agrupación Temática de Razones y Mejoras UI

## Fase: Agrupación temática + mejoras de UX

### Cambios implementados

#### 1. Sistema de Categorías de Razones (`lib/reason-categories.ts`)

**Nuevo archivo** que mapea razones a categorías temáticas y dimensiones de bienestar:

- **💭 Desarrollo personal y bienestar**
  - PROPOSITO, HABITOS, AUTOCONOCIMIENTO
  - Dimensiones: Emotional, Physical, Spiritual, Intellectual

- **📘 Éxito académico y hábitos de estudio**
  - ORGANIZACION, MOTIVACION, ESTUDIO, EQUILIBRIO_ACA
  - Dimensiones: Intellectual, Emotional

- **🤝 Integración y comunidad**
  - INTEGRACION
  - Dimensiones: Social, Emotional, Spiritual

- **🌱 Oportunidades y recursos de apoyo**
  - OPORTUNIDADES, CANALIZACION
  - Dimensiones: Financial, Social, Occupational

- **✳️ Otro / seguimiento general**
  - OTRO
  - Dimensiones: Multidimensional

**Razones legacy (deprecadas):**
- TRAMITES, CARGA, EMOCIONAL → Redirigidas automáticamente a CANALIZACION
- Con hints de derivación: "Servicios Escolares", "Dirección de Programa", "Consejería emocional"

**Funciones helper para KPIs:**
- `getWellbeingDimensions(code)` - Obtiene dimensiones desde `reason.code`
- `getCategoryByCode(code)` - Obtiene categoría desde `reason.code`
- `getEffectiveReason(code)` - Maneja redirecciones legacy

#### 2. Componente ReasonSelect Mejorado

- ✅ Select agrupado con `<optgroup>` y headers visuales
- ✅ Solo muestra razones visibles (oculta deprecadas)
- ✅ Redirección automática para razones legacy
- ✅ Alerta informativa cuando se redirige
- ✅ Estilos consistentes con rounded-xl y focus states
- ✅ Compatibilidad: sigue enviando `reasonId` numérico a la API

#### 3. DurationPicker Mejorado

- ✅ Gradiente verde → azul (#22c55e → #3b82f6)
- ✅ Botones rápidos para 15, 30, 45, 60 min
- ✅ Navegación por teclado (Home, End, flechas)
- ✅ Estilos consistentes con slider de intensidad
- ✅ Mejor feedback visual del valor seleccionado

#### 4. Mocks de Test Actualizados

- ✅ Razones actualizadas con nuevos códigos y labels
- ✅ Razones legacy mantenidas para compatibilidad

### Archivos modificados

1. **lib/reason-categories.ts** (nuevo)
2. **components/ReasonSelect.tsx** (refactorizado)
3. **components/DurationPicker.tsx** (mejorado)
4. **lib/test-mocks.ts** (actualizado)
5. **db/migrations/0007_update_reasons_categories.sql** (nuevo, referencia)

### Cómo usar para KPIs

```typescript
import { getWellbeingDimensions, getCategoryByCode } from '@/lib/reason-categories';

// Desde reason.code en la BD
const dimensions = getWellbeingDimensions('PROPOSITO');
// → ['Emotional', 'Spiritual', 'Intellectual']

const category = getCategoryByCode('PROPOSITO');
// → 'desarrollo-personal'
```

### Migración de Base de Datos

La migración `0007_update_reasons_categories.sql` es **opcional**. El sistema funciona completamente con el mapeo en código, pero puedes ejecutarla para:

1. Agregar nuevas razones a la tabla `reasons`
2. Actualizar labels existentes
3. Marcar razones legacy como inactivas (opcional)

### Compatibilidad

- ✅ API: Sin cambios, sigue recibiendo `reasonId` numérico
- ✅ Razones legacy: Redirigidas automáticamente con mensaje
- ✅ Base de datos: No requiere cambios (dimensiones se calculan desde código)

### Próximos pasos recomendados

1. Ejecutar migración de BD (opcional) para sincronizar `reasons` con nuevos códigos
2. Actualizar reportes/dashboards para usar `getWellbeingDimensions()` en KPIs
3. Documentar uso de dimensiones en README de reportes

---

**Fecha:** 2024
**Commit sugerido:** `feat(reasons): thematic categorization with wellbeing dimensions — grouped select, legacy redirects, improved duration picker`
