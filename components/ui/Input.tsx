import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error = false, className = '', ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-2.5 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 text-slate-900 placeholder:text-slate-400';
    const stateStyles = error
      ? 'border-red-300 bg-red-50 focus-visible:ring-red-400 focus-visible:border-red-400'
      : 'border-slate-300 bg-white focus-visible:ring-slate-400 focus-visible:border-slate-500 hover:border-slate-400';

    return (
      <input
        ref={ref}
        className={`${baseStyles} ${stateStyles} ${className}`}
        aria-invalid={error}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;

