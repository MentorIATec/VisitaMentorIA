"use client";

import { useMemo } from 'react';
import { 
  getAllCategories, 
  getReasonByCode, 
  getEffectiveReason,
  getAllVisibleReasons,
  type ReasonWithCategory 
} from '@/lib/reason-categories';
import Alert from '@/components/ui/Alert';

type Reason = { id: number; code: string; label: string };

type ReasonSelectProps = {
  reasons: Reason[]; // Razones de la API (id, code, label)
  value: number | 'otro' | '';
  onChange: (v: number | 'otro' | '') => void;
  otherText: string;
  onOtherTextChange: (v: string) => void;
};

export default function ReasonSelect({ reasons, value, onChange, otherText, onOtherTextChange }: ReasonSelectProps) {
  // Mapear razones de la API al formato con categorías
  const reasonMap = useMemo(() => {
    const map = new Map<string, Reason>();
    reasons.forEach(r => map.set(r.code, r));
    return map;
  }, [reasons]);

  // Obtener razones visibles agrupadas por categoría
  const groupedReasons = useMemo(() => {
    const categories = getAllCategories();
    const visibleReasons = getAllVisibleReasons();
    
    return categories.map(category => {
      const categoryReasons = visibleReasons
        .filter(r => r.category === category)
        .map(r => {
          const apiReason = reasonMap.get(r.code);
          if (!apiReason) return null;
          return {
            ...r,
            id: apiReason.id, // Conservar ID de la API para compatibilidad
            apiLabel: apiReason.label
          };
        })
        .filter((r): r is ReasonWithCategory & { id: number; apiLabel: string } => r !== null);
      
      return {
        category,
        categoryLabel: visibleReasons.find(r => r.category === category)?.categoryLabel || '',
        reasons: categoryReasons
      };
    }).filter(group => group.reasons.length > 0);
  }, [reasonMap]);

  // Verificar si hay razones legacy seleccionadas
  const legacyWarning = useMemo(() => {
    if (!value || value === 'otro') return null;
    
    const selectedReason = reasons.find(r => r.id === value);
    if (!selectedReason) return null;
    
    const reasonConfig = getReasonByCode(selectedReason.code);
    if (!reasonConfig?.deprecated) return null;
    
    const effective = getEffectiveReason(selectedReason.code);
    return {
      original: reasonConfig,
      effective: effective,
      hint: reasonConfig.referralHint || 'Redirigir a otra área'
    };
  }, [value, reasons]);

  const handleChange = (newValue: number | 'otro' | '') => {
    if (newValue === '' || newValue === 'otro') {
      onChange(newValue);
      return;
    }

    // Verificar si es legacy y redirigir
    const selectedReason = reasons.find(r => r.id === newValue);
    if (selectedReason) {
      const effective = getEffectiveReason(selectedReason.code);
      if (effective && effective.code !== selectedReason.code) {
        // Redirigir a la razón efectiva
        const effectiveApiReason = reasons.find(r => r.code === effective.code);
        if (effectiveApiReason) {
          onChange(effectiveApiReason.id);
          return;
        }
      }
    }
    
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {/* Alerta de redirección legacy */}
      {legacyWarning && (
        <Alert variant="warning" className="text-sm">
          <div>
            <p className="font-medium mb-1">Redirección automática</p>
            <p className="text-xs">
              "{legacyWarning.original.label}" ha sido redirigido a "{legacyWarning.effective?.label}".
            </p>
            {legacyWarning.hint && (
              <p className="text-xs mt-1 italic">💡 {legacyWarning.hint}</p>
            )}
          </div>
        </Alert>
      )}

      {/* Select agrupado */}
      <select
        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          handleChange(v === 'otro' ? 'otro' : v ? Number(v) : '');
        }}
        aria-label="Motivo de la sesión"
      >
        <option value="">Selecciona un motivo…</option>
        {groupedReasons.map((group) => (
          <optgroup key={group.category} label={group.categoryLabel}>
            {group.reasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </optgroup>
        ))}
        <option value="otro">Otro…</option>
      </select>

      {/* Campo de texto para "otro" */}
      {value === 'otro' && (
        <div className="space-y-2">
          <input
            type="text"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="Describe brevemente el motivo de tu sesión..."
            aria-label="Descripción del motivo"
          />
          <p className="text-xs text-slate-500">
            Este campo es opcional pero nos ayuda a personalizar tu acompañamiento.
          </p>
        </div>
      )}
    </div>
  );
}


