import { ReactNode } from 'react';

interface AlertProps {
  variant?: 'error' | 'warning' | 'info' | 'success';
  children: ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}

export default function Alert({ variant = 'info', children, className = '', role = 'alert' }: AlertProps) {
  const baseStyles = 'rounded-lg p-4 border';
  const variants = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      role={role}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

