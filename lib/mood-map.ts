export type MoodValence = 'dificil' | 'neutral' | 'agradable';

/**
 * Constantes para mapeo de valencia a número
 * Ajustables según necesidades del dashboard
 */
export const VALENCE_MAP = {
  dificil: -3,
  neutral: 0,
  agradable: +3
} as const;

/**
 * Constantes para mapeo de intensidad a energía
 * Rango: 1 → -3, 3 → 0, 5 → +3
 * Escalable a ±5 si el dashboard requiere rangos más amplios
 */
export const INTENSITY_TO_ENERGY_SCALE = 1.5; // Factor de escalado
export const INTENSITY_CENTER = 3; // Intensidad central (neutral)

/**
 * Mapea valencia categórica a número para KPIs
 * @param v Valencia: 'dificil' | 'neutral' | 'agradable'
 * @returns Número entre -5 y +5 (por defecto: dificil→-3, neutral→0, agradable→+3)
 */
export function mapValenceToNum(v: MoodValence): number {
  return VALENCE_MAP[v];
}

/**
 * Mapea intensidad (1-5) a energía numérica para KPIs
 * @param i Intensidad entre 1 y 5
 * @returns Número entre -5 y +5
 * Fórmula: (i - 3) * 1.5
 * - 1 → -3
 * - 2 → -1.5 (redondeado a -2)
 * - 3 → 0
 * - 4 → 1.5 (redondeado a 2)
 * - 5 → +3
 */
export function mapIntensityToEnergy(i: number): number {
  if (i < 1 || i > 5) {
    throw new Error(`Intensidad debe estar entre 1 y 5, recibido: ${i}`);
  }
  return Math.round((i - INTENSITY_CENTER) * INTENSITY_TO_ENERGY_SCALE);
}

/**
 * Determina la banda de intensidad desde el valor numérico
 * @param intensity Valor entre 1 y 5
 * @returns 'baja' | 'media' | 'alta'
 */
export function getIntensityBand(intensity: number): 'baja' | 'media' | 'alta' {
  if (intensity < 1 || intensity > 5) {
    throw new Error(`Intensidad debe estar entre 1 y 5, recibido: ${intensity}`);
  }
  if (intensity <= 2) return 'baja';
  if (intensity <= 4) return 'media';
  return 'alta';
}

/**
 * Obtiene el descriptor textual de intensidad
 * @param intensity Valor entre 1 y 5
 * @returns 'Suaves' | 'Moderadas' | 'Muy intensas'
 */
export function getIntensityDescriptor(intensity: number): 'Suaves' | 'Moderadas' | 'Muy intensas' {
  if (intensity < 1 || intensity > 5) {
    throw new Error(`Intensidad debe estar entre 1 y 5, recibido: ${intensity}`);
  }
  if (intensity <= 2) return 'Suaves';
  if (intensity === 3) return 'Moderadas';
  return 'Muy intensas';
}

