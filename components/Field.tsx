"use client";

import { ReactNode } from 'react';

type FieldProps = {
  label: string;
  htmlFor?: string;
  help?: ReactNode;
  error?: string | null;
  children: ReactNode;
};

export default function Field({ label, htmlFor, help, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700 mb-1.5" htmlFor={htmlFor}>{label}</label>
      {children}
      {help && <div className="text-xs text-slate-500 mt-1">{help}</div>}
      {error && <div className="text-xs text-red-600 mt-1" role="alert">{error}</div>}
    </div>
  );
}


