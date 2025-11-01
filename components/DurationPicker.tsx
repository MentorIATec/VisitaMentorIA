"use client";

import { KeyboardEvent } from 'react';

type DurationPickerProps = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

export default function DurationPicker({ value, onChange, min = 5, max = 60, step = 5 }: DurationPickerProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(min, value - step));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(max, value + step));
    }
  };

  // Calcular gradiente según valor (verde suave → azul)
  const getGradientColor = () => {
    const percentage = ((value - min) / (max - min)) * 100;
    // Gradiente verde suave → azul (#22c55e → #3b82f6)
    return `linear-gradient(to right, #22c55e 0%, #3b82f6 ${percentage}%, #e2e8f0 ${percentage}%)`;
  };

  // Marcas de tiempo importantes
  const timeMarks = [15, 30, 45, 60].filter(m => m >= min && m <= max);

  return (
    <div className="space-y-3">
      {/* Slider con gradiente */}
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-track]:bg-slate-200"
          style={{
            background: getGradientColor()
          }}
          aria-label="Duración de la sesión en minutos"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} minutos`}
        />
        <span className="w-16 text-center text-lg font-semibold text-slate-900">
          {value} min
        </span>
      </div>

      {/* Marcas de tiempo y escala */}
      <div className="relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>{min} min</span>
          <div className="flex-1 px-4">
            <div className="flex items-center justify-between">
              {timeMarks.map((mark) => (
                <button
                  key={mark}
                  type="button"
                  onClick={() => onChange(mark)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    value === mark
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                  aria-label={`Seleccionar ${mark} minutos`}
                >
                  {mark}
                </button>
              ))}
            </div>
          </div>
          <span>{max} min</span>
        </div>
      </div>
    </div>
  );
}


