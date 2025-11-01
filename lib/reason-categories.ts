export type WellbeingDimension =
  | 'Emotional' | 'Physical' | 'Spiritual' | 'Intellectual'
  | 'Social' | 'Financial' | 'Occupational' | 'Multidimensional';

export type ReasonCategory =
  | 'desarrollo-personal'        // 💭
  | 'exito-academico'            // 📘
  | 'integracion'                // 🤝
  | 'oportunidades'              // 🌱
  | 'otro';                      // ✳️

export interface ReasonWithCategory {
  code: string;               // reason.code existente
  label: string;              // texto visible en UI (subtema)
  category: ReasonCategory;   // grupo visible
  categoryLabel: string;      // encabezado visible del grupo
  dimensions: WellbeingDimension[]; // para KPIs
  deprecated?: boolean;       // si ya no debe mostrarse en UI
  redirectToCode?: string;    // a qué reason.code redirigir (legacy)
  referralHint?: string;      // mensaje de derivación sugerida
}

// Encabezados visibles
export const CATEGORY_LABELS: Record<ReasonCategory, string> = {
  'desarrollo-personal': '💭 Desarrollo personal y bienestar',
  'exito-academico': '📘 Éxito académico y hábitos de estudio',
  'integracion': '🤝 Integración y comunidad',
  'oportunidades': '🌱 Oportunidades y recursos de apoyo',
  'otro': '✳️ Otro / seguimiento general',
};

// Catálogo vigente
export const REASONS: ReasonWithCategory[] = [
  // 💭 Desarrollo personal y bienestar
  {
    code: 'PROPOSITO',
    label: 'Propósito de vida, metas o dudas vocacionales',
    category: 'desarrollo-personal',
    categoryLabel: CATEGORY_LABELS['desarrollo-personal'],
    dimensions: ['Emotional', 'Spiritual', 'Intellectual'],
  },
  {
    code: 'HABITOS',
    label: 'Hábitos y equilibrio personal (sueño, descanso, salud, rutinas)',
    category: 'desarrollo-personal',
    categoryLabel: CATEGORY_LABELS['desarrollo-personal'],
    dimensions: ['Physical', 'Emotional'],
  },
  {
    code: 'AUTOCONOCIMIENTO',
    label: 'Autoconocimiento y crecimiento personal',
    category: 'desarrollo-personal',
    categoryLabel: CATEGORY_LABELS['desarrollo-personal'],
    dimensions: ['Emotional', 'Intellectual', 'Spiritual'],
  },

  // 📘 Éxito académico y hábitos de estudio
  {
    code: 'ORGANIZACION',
    label: 'Organización y gestión del tiempo',
    category: 'exito-academico',
    categoryLabel: CATEGORY_LABELS['exito-academico'],
    dimensions: ['Intellectual', 'Emotional'],
  },
  {
    code: 'MOTIVACION',
    label: 'Motivación o enfoque académico',
    category: 'exito-academico',
    categoryLabel: CATEGORY_LABELS['exito-academico'],
    dimensions: ['Intellectual', 'Emotional'],
  },
  {
    code: 'ESTUDIO',
    label: 'Estrategias de estudio y concentración',
    category: 'exito-academico',
    categoryLabel: CATEGORY_LABELS['exito-academico'],
    dimensions: ['Intellectual', 'Emotional'],
  },
  {
    code: 'EQUILIBRIO_ACA',
    label: 'Equilibrio académico–personal',
    category: 'exito-academico',
    categoryLabel: CATEGORY_LABELS['exito-academico'],
    dimensions: ['Intellectual', 'Emotional'],
  },

  // 🤝 Integración y comunidad
  {
    code: 'INTEGRACION',
    label: 'Adaptación, pertenencia y participación en comunidad',
    category: 'integracion',
    categoryLabel: CATEGORY_LABELS['integracion'],
    dimensions: ['Social', 'Emotional', 'Spiritual'],
  },
  {
    code: 'PARTICIPACION',
    label: 'Participación en grupos o comunidades',
    category: 'integracion',
    categoryLabel: CATEGORY_LABELS['integracion'],
    dimensions: ['Social', 'Emotional'],
  },

  // 🌱 Oportunidades y recursos de apoyo
  {
    code: 'OPORTUNIDADES',
    label: 'Becas, idiomas, movilidad u otras oportunidades',
    category: 'oportunidades',
    categoryLabel: CATEGORY_LABELS['oportunidades'],
    dimensions: ['Financial', 'Social', 'Occupational'],
  },
  {
    code: 'CANALIZACION',
    label: 'Canalización o derivación a otras áreas (bienestar, salud, liderazgo, etc.)',
    category: 'oportunidades',
    categoryLabel: CATEGORY_LABELS['oportunidades'],
    dimensions: ['Social', 'Occupational'],
  },
  {
    code: 'APOYO_PERSONAL',
    label: 'Apoyo en temas personales o socioeconómicos',
    category: 'oportunidades',
    categoryLabel: CATEGORY_LABELS['oportunidades'],
    dimensions: ['Financial', 'Social'],
  },

  // ✳️ Otro
  {
    code: 'SEGUIMIENTO',
    label: 'Seguimiento de compromisos o acuerdos previos',
    category: 'otro',
    categoryLabel: CATEGORY_LABELS['otro'],
    dimensions: ['Multidimensional'],
  },

  // ---------- Legacy (deprecadas y redirigidas) ----------
  {
    code: 'TRAMITES',
    label: 'Trámites / administrativo (no se gestiona desde mentoría)',
    category: 'oportunidades',
    categoryLabel: CATEGORY_LABELS['oportunidades'],
    dimensions: ['Multidimensional'],
    deprecated: true,
    redirectToCode: 'CANALIZACION',
    referralHint: 'Derivar a Servicios Escolares',
  },
  {
    code: 'CARGA',
    label: 'Planeación de carga/semestre (competencia de Dirección de Programa)',
    category: 'exito-academico',
    categoryLabel: CATEGORY_LABELS['exito-academico'],
    dimensions: ['Multidimensional'],
    deprecated: true,
    redirectToCode: 'CANALIZACION',
    referralHint: 'Derivar a Dirección de Programa',
  },
  {
    code: 'EMOCIONAL',
    label: 'Acompañamiento emocional (no terapéutico en mentoría)',
    category: 'oportunidades',
    categoryLabel: CATEGORY_LABELS['oportunidades'],
    dimensions: ['Emotional'],
    deprecated: true,
    redirectToCode: 'CANALIZACION',
    referralHint: 'Derivar a Consejería emocional',
  },
];

// Helpers
export const isVisible = (r: ReasonWithCategory) => !r.deprecated;

export function getReasonByCode(code: string): ReasonWithCategory | undefined {
  return REASONS.find(r => r.code === code);
}

export function getEffectiveReason(code: string): ReasonWithCategory | undefined {
  const r = getReasonByCode(code);
  if (!r) return undefined;
  if (r.deprecated && r.redirectToCode) return getReasonByCode(r.redirectToCode);
  return r;
}

export function getReasonsByCategory(category: ReasonCategory): ReasonWithCategory[] {
  return REASONS.filter(r => r.category === category && isVisible(r));
}

export function getAllVisibleReasons(): ReasonWithCategory[] {
  return REASONS.filter(isVisible);
}

export function getAllCategories(): ReasonCategory[] {
  return ['desarrollo-personal', 'exito-academico', 'integracion', 'oportunidades', 'otro'];
}

/**
 * Obtiene las dimensiones de bienestar asociadas a un reason.code
 * Útil para calcular KPIs desde reason_id en la base de datos
 * @param code Código de la razón (ej: 'PROPOSITO', 'HABITOS')
 * @returns Array de dimensiones de bienestar
 */
export function getWellbeingDimensions(code: string): WellbeingDimension[] {
  const reason = getEffectiveReason(code);
  return reason?.dimensions || ['Multidimensional'];
}

/**
 * Obtiene la categoría de una razón por su código
 * @param code Código de la razón
 * @returns Categoría o undefined si no existe
 */
export function getCategoryByCode(code: string): ReasonCategory | undefined {
  const reason = getEffectiveReason(code);
  return reason?.category;
}
