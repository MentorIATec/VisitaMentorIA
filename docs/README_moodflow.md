# MoodFlow: Nuevo Flujo de Emociones

## Rationale

El componente `MoodFlow` reemplaza el `MoodMeterInteractive` (cuadrante valence/energy) por una vista unificada que muestra simultáneamente todos los elementos del registro emocional:

1. **Valencia**: SegmentedControl centrado con opciones "Más difíciles / Neutras / Más agradables"
2. **Intensidad**: Slider 1-5 con gradientes dinámicos según valencia y descriptores textuales (Suaves/Moderadas/Muy intensas)
3. **Etiqueta**: Chips de emociones filtradas según combinación valencia + intensidad, centrados horizontalmente
4. **Reflexión**: Textarea para nota libre (opcional, hasta 300 caracteres)
5. **Resumen dinámico**: Mensaje siempre visible con `aria-live` que actualiza en tiempo real con nueva plantilla empática
6. **Cierre humanizado**: Mensaje de agradecimiento al completar el formulario

**Diseño unificado (Fase 7.5)**: Todos los elementos se muestran en una sola pantalla sin navegación entre pasos, mejorando la fluidez y la autorreflexión, con tono empático y jerarquía visual refinada.

Este cambio mejora:
- **Usabilidad**: Vista unificada que permite ajustar libremente la experiencia emocional antes de enviar
- **Fluidez**: Sin transiciones ni pasos intermedios, todo visible simultáneamente
- **Accesibilidad**: Navegación por teclado completa, aria-live en resumen, focus visible
- **RULER-friendly**: Lenguaje neutro, sin adjetivos forzados
- **Compatibilidad**: Se mapea a valores numéricos para mantener KPIs existentes

## Mapeo a KPIs

Los valores categóricos se convierten a numéricos para mantener compatibilidad con dashboards:

### Valencia → Número

```typescript
dificil   → -3
neutral   → 0
agradable → +3
```

Constantes en `lib/mood-map.ts`: `VALENCE_MAP`

### Intensidad → Energía

```typescript
Intensidad 1 → Energía -3
Intensidad 2 → Energía -2 (redondeado desde -1.5)
Intensidad 3 → Energía 0
Intensidad 4 → Energía +2 (redondeado desde 1.5)
Intensidad 5 → Energía +3
```

Fórmula: `(intensidad - 3) * 1.5`

Constantes ajustables en `lib/mood-map.ts`:
- `INTENSITY_TO_ENERGY_SCALE = 1.5`
- `INTENSITY_CENTER = 3`

Si el dashboard requiere rango ±5 más amplio, escalar `INTENSITY_TO_ENERGY_SCALE` a `2.5`.

## Estructura de `emotions.json`

Archivo en `public/config/emotions.json`:

```json
{
  "valence": ["dificil", "neutral", "agradable"],
  "intensity": ["baja", "media", "alta"],
  "emotions": {
    "agradable": {
      "alta": [...],
      "media": [...],
      "baja": [...]
    },
    "dificil": { ... },
    "neutral": { ... }
  },
  "emoji": {
    "agradable": { "alta": [...], "media": [...], "baja": [...] },
    ...
  }
}
```

### Cómo extender

1. **Agregar emociones**: Editar `emotions.{valence}.{banda}` con nuevas palabras
2. **Agregar emojis**: Editar `emoji.{valence}.{banda}` (pueden repetirse)
3. **Cambiar bandas**: Modificar `getIntensityBand()` en `lib/mood-map.ts` si cambian los umbrales

Bandas actuales:
- **baja**: intensidad 1-2
- **media**: intensidad 3-4
- **alta**: intensidad 5

## Componentes UI

### SegmentedControl (`components/ui/SegmentedControl.tsx`)
- Componente reutilizable para selección de valencia
- Estilos CSS con clases `.segmented button[data-active]`
- Soporte completo de teclado y aria-pressed

### Slider (`components/ui/Slider.tsx`)
- Slider con gradientes dinámicos según `valence`
- Gradientes según especificación:
  - **Difíciles**: `#f59e0b` → `#ef4444` (con overlay neutro 20% para contraste AA)
  - **Neutras**: `#a3a3a3` → `#6b7280`
  - **Agradables**: `#22c55e` → `#3b82f6`
- Soporte teclado: `←`, `→`, `Home`, `End`
- Muestra emojis contextuales según valencia e intensidad
- Descriptores textuales dinámicos bajo el slider:
  - **1-2**: "Suaves"
  - **3**: "Moderadas"
  - **4-5**: "Muy intensas"
- `aria-valuetext` actualizado con descriptores para accesibilidad

### Chip (`components/ui/Chip.tsx`)
- Componente actualizado con soporte para estilos `.chip[data-selected]`
- Usado para mostrar emociones seleccionables
- Centrado horizontalmente con `justify-center`
- Estado seleccionado: `border-2 border-emerald-500 bg-emerald-50`
- Animación hover: `scale-105 duration-150`
- Focus visible con ring emerald-400
- `aria-label` y `aria-pressed` para accesibilidad

## Estructura Visual Refinada (Fase 7.5)

### Jerarquía y Espaciado
- Espaciado reducido: `space-y-4` (antes `space-y-6`)
- Padding lateral aumentado: `px-4 sm:px-6` para balance visual
- Bordes redondeados uniformes: `rounded-xl`
- Selector de valencia centrado: `flex justify-center gap-3 my-4`
- Chips centrados horizontalmente: `justify-center`

### Tablas de Mapeo

#### Emojis ↔ Valencia
| Valencia | Banda | Emojis |
|----------|-------|--------|
| Difíciles | Alta | Emojis contextuales según `emotions.json` |
| Difíciles | Media | Emojis contextuales según `emotions.json` |
| Difíciles | Baja | Emojis contextuales según `emotions.json` |
| Neutras | Alta/Media/Baja | Emojis contextuales según `emotions.json` |
| Agradables | Alta/Media/Baja | Emojis contextuales según `emotions.json` |

#### Gradiente ↔ Valencia
| Valencia | Gradiente Inicio | Gradiente Fin | Notas |
|----------|-----------------|---------------|-------|
| Difíciles | `#f59e0b` (amber-500) | `#ef4444` (red-500) | Con overlay neutro 20% para contraste AA |
| Neutras | `#a3a3a3` (gray-400) | `#6b7280` (gray-500) | - |
| Agradables | `#22c55e` (green-500) | `#3b82f6` (blue-500) | - |

#### Descriptor ↔ Intensidad
| Intensidad | Descriptor | Rango |
|------------|------------|-------|
| 1-2 | "Suaves" | Baja |
| 3 | "Moderadas" | Media |
| 4-5 | "Muy intensas" | Alta |

### Plantilla de Resumen Accesible

Formato del resumen dinámico (siempre visible cuando `label` y `valence` están completos):

```
🌿 Parece que hoy sientes {label}, con intensidad {descriptor} y emociones {valenceTxt}.
```

Donde:
- `{label}`: Emoción seleccionada (ej: "tensión", "paz", "equilibrio")
- `{descriptor}`: Descriptor de intensidad ("Suaves", "Moderadas", "Muy intensas")
- `{valenceTxt}`: Texto de valencia ("difíciles", "neutras", "agradables")

Ejemplo:
```
🌿 Parece que hoy sientes tensión, con intensidad Muy intensas y emociones difíciles.
```

### Tono y Lenguaje Empático

**Encabezado único:**
- "¿Cómo se sienten tus emociones hoy?" (sin duplicado)
- Descripción: "Elige lo que más se acerque a tu experiencia. Luego dinos la intensidad e identifica una palabra."

**Cierre humanizado:**
Al completar el formulario (cuando `valence` y `label` están presentes):
```
💬 Gracias por compartir cómo te sientes hoy.
Tu registro nos ayuda a acompañarte mejor.
```

**Características del tono:**
- Lenguaje cálido y cercano
- Sin referencias institucionales
- Agradecimiento genuino
- Mensaje breve y centrado
- Sin acción requerida del usuario

## Accesibilidad

### Características implementadas

- **aria-live**: Resumen dinámico siempre visible con `aria-live="polite"` que actualiza en tiempo real
- **aria-valuetext**: Slider con descriptores textuales ("Suaves", "Moderadas", "Muy intensas")
- **Navegación por teclado**:
  - Slider: `Home` (1), `End` (5), `ArrowLeft/Right/Up/Down` (incremento/decremento)
  - Chips: `Enter` o `Space` para seleccionar
  - Segmented control: Tab + Enter/Space
- **Focus visible**: Ring visible en todos los elementos interactivos (ring-emerald-400 para chips)
- **Contraste AA**: Colores cumplen WCAG 2.1 AA (con overlay 20% en gradientes difíciles)
- **Roles ARIA**: `radiogroup`, `group`, `aria-pressed`, `aria-valuetext`, `aria-live`, `aria-label`

### Mejoras futuras

- Soporte para `aria-describedby` en campos con ayuda contextual
- Screen reader: anunciar cantidad de emociones disponibles

## Impacto en CSV y Dashboards

### Nuevas columnas en `mood_events`

- `intensity`: `SMALLINT` (1-5)
- `note`: `TEXT` (nota libre del usuario)

### Campos mapeados (compatibilidad)

- `valence`: Número (-5..+5) calculado desde valencia categórica
- `energy`: Número (-5..+5) calculado desde intensidad
- `label`: Emoción seleccionada (string)
- `quadrant`: `NULL` para nuevo formato (mantiene compatibilidad con antiguo)

### Export CSV

El dashboard `/admin` y `/mentor` deben incluir nuevas columnas:
- `mood_intensity_before`
- `mood_note_before`

Los KPIs existentes (`avg_delta_valence`, `avg_delta_energy`) funcionan sin cambios porque usan valores numéricos.

## Compatibilidad con formato antiguo

El endpoint `/api/session` acepta ambos formatos:

```typescript
// Nuevo formato (MoodFlow)
moodBefore: {
  valence: 'dificil' | 'neutral' | 'agradable',
  intensity: 1..5,
  intensityBand: 'baja' | 'media' | 'alta',
  label: string,
  note?: string
}

// Formato antiguo (MoodMeterInteractive)
moodBefore: {
  valence: -5..5,
  energy: -5..5,
  label?: string,
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
}
```

El backend detecta automáticamente el formato mediante presencia de `intensity`.

## Tests

### Unitarios

`tests/unit/mood-map.test.ts`:
- Mapeo de valencia a número
- Mapeo de intensidad a energía
- Cálculo de bandas de intensidad
- Descriptores de intensidad (`getIntensityDescriptor`): verifica "Suaves" (1-2), "Moderadas" (3), "Muy intensas" (4-5)

### E2E

`tests/e2e/register_moodflow.spec.ts`:
- Flujo completo unificado: verifica que todos los elementos son visibles simultáneamente
- Valencia dificil → intensidad alta → emoción "tensión"
- Valencia agradable → intensidad baja → emoción "paz"
- Verificación de encabezado único (sin duplicado)
- Verificación de selector de valencia centrado
- Verificación de descriptores dinámicos bajo slider ("Suaves", "Moderadas", "Muy intensas")
- Verificación de cierre humanizado visible
- Verificación de ausencia de checkbox de consentimiento en MoodFlow
- Verificación de botón "Atrás" mantiene datos previos
- Navegación por teclado (slider, chips, segmented control)
- Verificación de resumen dinámico con nueva plantilla

## Notas técnicas

- **Vista unificada**: Todos los elementos (valencia, intensidad, etiqueta, reflexión) se muestran en una sola pantalla sin navegación entre pasos
- **Encabezado único**: Sin duplicado, el componente MoodFlow maneja su propia estructura interna (sin Field wrapper)
- **Resumen dinámico**: Siempre visible cuando hay datos completos, actualiza en tiempo real con `aria-live="polite"` y nueva plantilla empática
- **Gradientes del slider**: Dinámicos según `valence`, implementados con CSS gradients según tabla de mapeo
- **Descriptores de intensidad**: Función `getIntensityDescriptor()` en `lib/mood-map.ts` para reutilización y testing
- **Estado inicial**: Por defecto `valence = 'neutral'`, `intensity = 3`, `label = ''`
- **Limpieza de estado**: Al cambiar `valence`, se limpia automáticamente el `label`
- **Idioma**: Español neutro (sin "x/e" ni adjetivos marcados por género)
- **RLS**: Se mantiene sin cambios
- **Validación Zod**: Acepta union de ambos formatos
- **SessionStorage**: Guarda `MoodFlowValue` completo para `/thanks`
- **Estructura del payload**: `moodBefore` incluye `valence`, `intensity`, `intensityBand`, `label`, `note`
- **Sin checkbox**: El checkbox de consentimiento no aparece en MoodFlow (solo en Step 1)

## Migración

Para aplicar en producción:

1. Ejecutar migración: `db/migrations/0006_mood_events_intensity_note.sql`
2. Deploy de código con `MoodFlow`
3. Los registros nuevos usan formato nuevo; antiguos siguen funcionando

No hay migración de datos requerida porque:
- Columnas nuevas son nullable
- Formato antiguo sigue soportado
- KPIs usan valores numéricos ya existentes

## Changelog

### Fase 7.5 — Ajuste Empático y Cierre Humanizado (2024)

**Cambios principales:**
- Eliminado encabezado duplicado en `register/page.tsx`
- Selector de valencia centrado con `justify-center gap-3 my-4`
- Microcopy de intensidad actualizado: "¿Qué tan intensas se sienten tus emociones ahora?"
- Descriptores dinámicos bajo slider: "Suaves", "Moderadas", "Muy intensas"
- Gradientes del slider actualizados según valencia:
  - Difíciles: `#f59e0b` → `#ef4444` (con overlay 20%)
  - Neutras: `#a3a3a3` → `#6b7280`
  - Agradables: `#22c55e` → `#3b82f6`
- Chips centrados horizontalmente con estado seleccionado `border-emerald-500 bg-emerald-50`
- Cierre humanizado agregado al final del formulario
- Espaciado refinado: `space-y-4`, `px-4 sm:px-6`, `rounded-xl`
- Resumen dinámico con nueva plantilla empática
- Función `getIntensityDescriptor()` extraída a `lib/mood-map.ts` para testing
- Estado inicial por defecto: `valence = 'neutral'`, `intensity = 3`, `label = ''`
- Tests E2E actualizados para verificar nuevos elementos visuales

**Commit message sugerido:**
```
feat(moodflow): empathetic emotional flow polish — unified heading, centered valence selector, dynamic intensity descriptors, empathetic closing message, refined spacing and gradients
```

