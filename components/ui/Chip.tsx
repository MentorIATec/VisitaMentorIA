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
  const baseStyles = 'px-3 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400';
  
  const variants = {
    default: selected
      ? 'bg-slate-900 text-white'
      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    outline: selected
      ? color 
        ? 'border-2' // Si hay color, usamos estilos inline
        : 'border-2 border-emerald-500 bg-emerald-50 text-emerald-900'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  };

  // Cuando hay color y variant=outline y selected, usar el color en estilos inline
  const getBackgroundColor = (color: string) => {
    // Convertir hex a rgba con opacidad 20%
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
    return `${color}20`;
  };

  const borderColor = color && selected && variant === 'outline' ? { borderColor: color } : color && selected && variant === 'default' ? { borderColor: color } : {};
  const bgColor = color && selected && variant === 'default' 
    ? { backgroundColor: color } 
    : color && selected && variant === 'outline' 
    ? { backgroundColor: getBackgroundColor(color), borderColor: color, color: color } 
    : {};

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

