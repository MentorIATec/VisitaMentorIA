import { ButtonHTMLAttributes } from 'react';

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  'aria-label'?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel
}: SegmentedControlProps) {
  return (
    <div
      className={`inline-flex rounded-full border border-gray-300 bg-white p-1 segmented ${className}`}
      role="radiogroup"
      aria-label={ariaLabel || 'Opciones'}
    >
      {options.map((option, index) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            data-active={isActive.toString()}
            className="px-3 py-1.5 text-sm rounded-full border font-medium transition"
            aria-pressed={isActive}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

