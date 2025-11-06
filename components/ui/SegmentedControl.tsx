import { ButtonHTMLAttributes, KeyboardEvent } from 'react';

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
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      newIndex = index > 0 ? index - 1 : options.length - 1;
      onChange(options[newIndex]);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      newIndex = index < options.length - 1 ? index + 1 : 0;
      onChange(options[newIndex]);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(options[0]);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(options[options.length - 1]);
    }
  };

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
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            data-active={isActive.toString()}
            className="px-3 py-1.5 text-sm rounded-full border font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400"
            tabIndex={isActive ? 0 : -1}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

