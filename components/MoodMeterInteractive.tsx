"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type MoodConfig = {
  scale: { min: number; max: number };
  quadrants: Array<{
    id: 'Q1' | 'Q2' | 'Q3' | 'Q4';
    name: string;
    range: { valence: [number, number]; energy: [number, number] };
    labels: string[];
  }>;
};

export type MoodValue = {
  valence: number;
  energy: number;
  label?: string | null;
  quadrant?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | null;
};

type Props = {
  value: MoodValue;
  onChange: (v: MoodValue) => void;
  min?: number;
  max?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pickLabel(labels: string[]): string | null {
  if (!labels.length) return null;
  const idx = Math.floor(Math.random() * labels.length);
  return labels[idx] || null;
}

export function quadrantFrom(config: MoodConfig, valence: number, energy: number): { quadrant: 'Q1' | 'Q2' | 'Q3' | 'Q4'; label: string | null } {
  for (const q of config.quadrants) {
    const [vMin, vMax] = q.range.valence;
    const [eMin, eMax] = q.range.energy;
    if (valence >= vMin && valence <= vMax && energy >= eMin && energy <= eMax) {
      return { quadrant: q.id, label: pickLabel(q.labels) };
    }
  }
  // Fallback: usa Q1
  const q1 = config.quadrants[0];
  return { quadrant: q1.id as 'Q1' | 'Q2' | 'Q3' | 'Q4', label: pickLabel(q1.labels) };
}

// Mapeo de cuadrantes a colores según RULER
const quadrantColors = {
  Q1: { bg: 'bg-yellow-50', border: 'border-yellow-200', hover: 'hover:bg-yellow-100', emoji: '😊' }, // Amarillo: Energía alta / Placer alto
  Q2: { bg: 'bg-red-50', border: 'border-red-200', hover: 'hover:bg-red-100', emoji: '😤' }, // Rojo: Energía alta / Placer bajo
  Q3: { bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100', emoji: '😔' }, // Azul: Energía baja / Placer bajo
  Q4: { bg: 'bg-green-50', border: 'border-green-200', hover: 'hover:bg-green-100', emoji: '😌' }, // Verde: Energía baja / Placer alto
};

// Nombres emocionales según RULER
const quadrantEmotions = {
  Q1: ['entusiasmado', 'feliz'],
  Q2: ['frustrado', 'ansioso'],
  Q3: ['cansado', 'triste'],
  Q4: ['tranquilo', 'satisfecho'],
};

export default function MoodMeterInteractive({ value, onChange, min = -5, max = 5 }: Props) {
  const [config, setConfig] = useState<MoodConfig | null>(null);
  const [hoveredQuadrant, setHoveredQuadrant] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/config/mood.json');
        setConfig(await res.json());
      } catch (err) {
        console.error('Error loading mood config:', err);
      }
    })();
  }, []);

  const rangeMin = config?.scale.min ?? min;
  const rangeMax = config?.scale.max ?? max;

  const currentQuadrant = useMemo(() => {
    if (!config) return null;
    return quadrantFrom(config, value.valence, value.energy);
  }, [config, value.valence, value.energy]);

  const announce = useMemo(() => {
    if (!config || !currentQuadrant) return '';
    const { quadrant, label } = currentQuadrant;
    const emotion = quadrantEmotions[quadrant]?.[0] || '—';
    return `Hoy te sientes ${emotion}. ${label ? `Emoción: ${label}` : ''}. Cuadrante: ${quadrant}, Placer: ${value.valence}, Energía: ${value.energy}`;
  }, [config, currentQuadrant, value.valence, value.energy]);

  // Actualizar label y quadrant cuando cambian los valores
  useEffect(() => {
    if (!config || !currentQuadrant) return;
    const { quadrant, label } = currentQuadrant;
    if (value.quadrant !== quadrant || value.label !== label) {
      onChange({ ...value, quadrant, label });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, value.valence, value.energy]);

  // Actualizar aria-live cuando cambia el anuncio
  useEffect(() => {
    if (liveRef.current && announce) {
      liveRef.current.textContent = announce;
    }
  }, [announce]);

  function nToPct(n: number) {
    return ((n - rangeMin) / (rangeMax - rangeMin)) * 100;
  }

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    let dv = 0; let de = 0;
    const step = e.shiftKey ? 2 : 1;
    if (e.key === 'ArrowLeft') dv = -step;
    if (e.key === 'ArrowRight') dv = step;
    if (e.key === 'ArrowDown') de = -step;
    if (e.key === 'ArrowUp') de = step;
    if (dv !== 0 || de !== 0) {
      e.preventDefault();
      const v = clamp(value.valence + dv, rangeMin, rangeMax);
      const en = clamp(value.energy + de, rangeMin, rangeMax);
      onChange({ ...value, valence: v, energy: en });
    }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width; // 0..1
    const y = (e.clientY - rect.top) / rect.height; // 0..1
    const v = Math.round(rangeMin + x * (rangeMax - rangeMin));
    const en = Math.round(rangeMin + (1 - y) * (rangeMax - rangeMin));
    onChange({ ...value, valence: clamp(v, rangeMin, rangeMax), energy: clamp(en, rangeMin, rangeMax) });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!config || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const v = rangeMin + x * (rangeMax - rangeMin);
    const en = rangeMin + (1 - y) * (rangeMax - rangeMin);
    const { quadrant } = quadrantFrom(config, v, en);
    setHoveredQuadrant(quadrant);
    // Posición relativa al contenedor para el tooltip
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleMouseLeave() {
    setHoveredQuadrant(null);
    setTooltipPos(null);
  }

  // Obtener emoción actual para el feedback visual
  const currentEmotion = currentQuadrant ? quadrantEmotions[currentQuadrant.quadrant]?.[0] : null;
  const currentEmoji = currentQuadrant ? quadrantColors[currentQuadrant.quadrant]?.emoji : null;

  return (
    <div className="space-y-4">
      {/* Feedback visual */}
      {currentQuadrant && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <span className="text-2xl" aria-hidden="true">{currentEmoji}</span>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">
              Hoy te sientes <span className="font-semibold">{currentEmotion || '—'}</span>
            </p>
            {currentQuadrant.label && (
              <p className="text-xs text-slate-600">{currentQuadrant.label}</p>
            )}
          </div>
        </div>
      )}

      {/* Mood Meter interactivo */}
      <div className="relative">
        <div
          ref={containerRef}
          role="slider"
          aria-label="Mood Meter"
          tabIndex={0}
          onKeyDown={handleKey}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full h-64 rounded-2xl border-2 border-slate-300 overflow-hidden cursor-pointer select-none shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          aria-valuetext={announce}
          aria-valuemin={rangeMin}
          aria-valuemax={rangeMax}
          aria-valuenow={value.valence}
        >
          {/* Fondo en cuadrantes con colores RULER */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {/* Q1: Amarillo (top-right) - Energía alta / Placer alto */}
            <div className={`${quadrantColors.Q1.bg} ${quadrantColors.Q1.border} border-r border-b transition-colors ${hoveredQuadrant === 'Q1' ? quadrantColors.Q1.hover : ''}`} />
            {/* Q2: Rojo (top-left) - Energía alta / Placer bajo */}
            <div className={`${quadrantColors.Q2.bg} ${quadrantColors.Q2.border} border-b transition-colors ${hoveredQuadrant === 'Q2' ? quadrantColors.Q2.hover : ''}`} />
            {/* Q3: Azul (bottom-left) - Energía baja / Placer bajo */}
            <div className={`${quadrantColors.Q3.bg} ${quadrantColors.Q3.border} border-r transition-colors ${hoveredQuadrant === 'Q3' ? quadrantColors.Q3.hover : ''}`} />
            {/* Q4: Verde (bottom-right) - Energía baja / Placer alto */}
            <div className={`${quadrantColors.Q4.bg} ${quadrantColors.Q4.border} transition-colors ${hoveredQuadrant === 'Q4' ? quadrantColors.Q4.hover : ''}`} />
          </div>

          {/* Ejes */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-400" />
            {/* Etiquetas de ejes */}
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-xs text-slate-600 font-medium">
              Placer bajo
            </div>
            <div className="absolute top-1 right-2 text-xs text-slate-600 font-medium">
              Placer alto
            </div>
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-slate-600 font-medium">
              Energía baja
            </div>
            <div className="absolute left-1 bottom-1 text-xs text-slate-600 font-medium">
              Energía alta
            </div>
          </div>

          {/* Puntero */}
          {currentQuadrant && (
            <div
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-slate-900 bg-white shadow-lg transition-transform hover:scale-125"
              style={{ left: `${nToPct(value.valence)}%`, top: `${100 - nToPct(value.energy)}%` }}
              aria-hidden="true"
            />
          )}

          {/* Tooltip al hover */}
          {hoveredQuadrant && tooltipPos && config && (
            <div
              className="absolute z-10 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y - 50}px`,
                transform: 'translateX(-50%)',
              }}
              role="tooltip"
              aria-hidden="true"
            >
              {(() => {
                const q = config.quadrants.find((q) => q.id === hoveredQuadrant);
                const emotion = quadrantEmotions[hoveredQuadrant]?.[0] || '';
                return q ? `${emotion}: ${q.name}` : '';
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Accesibilidad: aria-live para screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" ref={liveRef} />
    </div>
  );
}

