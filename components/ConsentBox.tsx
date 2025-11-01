"use client";

type ConsentBoxProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  showCheckbox?: boolean;
};

export default function ConsentBox({ checked, onChange, showCheckbox = true }: ConsentBoxProps) {
  if (!showCheckbox) {
    return null;
  }

  return (
    <div className="flex items-start gap-2">
      <input
        id="consent-followup"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded border-slate-300 text-slate-600 focus:ring-slate-500"
        aria-label="Consentimiento para seguimiento"
      />
      <label htmlFor="consent-followup" className="text-sm leading-5 text-slate-700">
        Acepto recibir un mensaje de seguimiento después de mi sesión. Este registro es anónimo y se utiliza únicamente para acompañarte mejor.
      </label>
    </div>
  );
}
