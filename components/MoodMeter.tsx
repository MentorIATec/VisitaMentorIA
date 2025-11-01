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

export default function MoodMeter({ value, onChange, min = -5, max = 5 }: Props) {
  const [config, setConfig] = useState<MoodConfig | null>(null);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/config/mood.json');
      setConfig(await res.json());
    })();
  }, []);

  const rangeMin = config?.scale.min ?? min;
  const rangeMax = config?.scale.max ?? max;

  const announce = useMemo(() => {
    if (!config) return '';
    const { quadrant, label } = quadrantFrom(config, value.valence, value.energy);
    return `Etiqueta: ${label ?? '—'}, Cuadrante: ${quadrant}, Placer: ${value.valence}, Energía: ${value.energy}`;
  }, [config, value.valence, value.energy]);

  useEffect(() => {
    if (!config) return;
    const { quadrant, label } = quadrantFrom(config, value.valence, value.energy);
    onChange({ ...value, quadrant, label });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, value.valence, value.energy]);

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

  return (
    <div>
      <div
        role="slider"
        aria-label="Mood Meter"
        tabIndex={0}
        onKeyDown={handleKey}
        onClick={handleClick}
        className="relative w-full h-48 rounded border overflow-hidden cursor-pointer select-none"
        aria-valuetext={announce}
        aria-valuemin={rangeMin}
        aria-valuemax={rangeMax}
        aria-valuenow={value.valence}
      >
        {/* Fondo en cuadrantes */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <div className="bg-emerald-50" />
          <div className="bg-amber-50" />
          <div className="bg-rose-50" />
          <div className="bg-sky-50" />
        </div>
        {/* Ejes */}
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300" />
        </div>
        {/* Puntero */}
        <div
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-black bg-white shadow"
          style={{ left: `${nToPct(value.valence)}%`, top: `${100 - nToPct(value.energy)}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="sr-only" aria-live="polite" ref={liveRef}>{announce}</div>
    </div>
  );
}


