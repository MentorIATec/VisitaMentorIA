import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: string;
  selected?: boolean;
  variant?: 'default' | 'outline';
}

export default function Chip({
  children,
  color,
  selected = false,
  variant = 'outline',
  className = '',
  ...props
}: ChipProps) {
  const baseStyles = 'px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-slate-400';
  
  const variants = {
    default: selected
      ? 'bg-slate-900 text-white'
      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    outline: selected
      ? 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  };

  const borderColor = color && selected ? { borderColor: color } : {};
  const bgColor = color && variant === 'default' && selected ? { backgroundColor: color } : {};

  return (
    <button
      className={`chip ${baseStyles} ${variants[variant]} ${className}`}
      style={{ ...borderColor, ...bgColor }}
      aria-pressed={selected}
      data-selected={selected}
      {...props}
    >
      {color && (
        <span
          className="inline-block w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

