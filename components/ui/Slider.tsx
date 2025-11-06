import { KeyboardEvent } from 'react';
import { getIntensityDescriptor } from '@/lib/mood-map';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icons?: string[];
  className?: string;
  valence?: 'dificil' | 'neutral' | 'agradable';
  intensityBand?: 'baja' | 'media' | 'alta';
  intensityDescriptor?: string;
  'aria-label'?: string;
}

export default function Slider({
  value,
  onChange,
  min = 1,
  max = 5,
  icons = [],
  className = '',
  valence,
  intensityBand,
  intensityDescriptor,
  'aria-label': ariaLabel
}: SliderProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Home') {
      e.preventDefault();
      onChange(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(min, value - 1));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(max, value + 1));
    }
  };

  // Calcular color del slider según valencia
  const getSliderColor = () => {
    if (!valence) {
      return `linear-gradient(to right, #22c55e 0%, #22c55e ${((value - min) / (max - min)) * 100}%, #e2e8f0 ${((value - min) / (max - min)) * 100}%)`;
    }

    const percentage = ((value - min) / (max - min)) * 100;

    if (valence === 'dificil') {
      // Gradiente naranja → rojo para difíciles: #f59e0b → #ef4444
      return `linear-gradient(to right, #f59e0b 0%, #ef4444 ${percentage}%, #e2e8f0 ${percentage}%)`;
    } else if (valence === 'neutral') {
      // Gradiente neutro: #a3a3a3 → #6b7280
      return `linear-gradient(to right, #a3a3a3 0%, #6b7280 ${percentage}%, #e2e8f0 ${percentage}%)`;
    } else {
      // Gradiente agradable: #22c55e → #3b82f6
      return `linear-gradient(to right, #22c55e 0%, #3b82f6 ${percentage}%, #e2e8f0 ${percentage}%)`;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="flex-1 h-2 rounded-lg appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-track]:bg-slate-200"
          style={{
            background: `${getSliderColor()}, linear-gradient(to right, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.2) 100%)`
          }}
          aria-label={ariaLabel || `Intensidad ${value} de ${max}`}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={intensityDescriptor ? `${intensityDescriptor}, ${value} de ${max}` : `Intensidad ${value}, banda ${intensityBand || 'media'}, ${value} de ${max}`}
        />
        <span className="w-8 text-center text-lg font-medium text-gray-900">{value}</span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Baja</span>
        <div className="flex-1 px-4">
          <div className="flex items-center justify-center gap-3">
            {icons.length > 0 ? (
              icons.slice(0, 3).map((icon, idx) => (
                <span key={idx} className="text-2xl" aria-hidden="true">
                  {icon}
                </span>
              ))
            ) : (
              <span className="font-medium text-gray-600">
                {intensityBand === 'baja' && 'Baja'}
                {intensityBand === 'media' && 'Media'}
                {intensityBand === 'alta' && 'Alta'}
              </span>
            )}
          </div>
        </div>
        <span>Alta</span>
      </div>
    </div>
  );
}

