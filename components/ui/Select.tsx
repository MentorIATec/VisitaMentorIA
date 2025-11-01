import { SelectHTMLAttributes, ReactNode, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, className = '', children, ...props }, ref) => {
    // SVG icon para dropdown
    const iconUrl = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E";
    
    const baseStyles = 'w-full px-4 py-2.5 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 appearance-none text-slate-900 bg-white bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat pr-10 hover:border-slate-400';
    const stateStyles = error
      ? 'border-red-300 bg-red-50 focus-visible:ring-red-400 focus-visible:border-red-400'
      : 'border-slate-300 focus-visible:ring-slate-400 focus-visible:border-slate-500';

    return (
      <select
        ref={ref}
        className={`${baseStyles} ${stateStyles} ${className}`}
        style={{
          backgroundImage: `url("${iconUrl}")`
        }}
        aria-invalid={error}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export default Select;

