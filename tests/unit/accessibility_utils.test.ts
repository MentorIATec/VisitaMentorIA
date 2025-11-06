import { describe, it, expect } from 'vitest';

/**
 * Utilidades para generar aria-describedby dinámicos
 */
export function buildAriaDescribedBy(helperId?: string, errorId?: string): string | undefined {
  if (errorId) return errorId;
  if (helperId) return helperId;
  return undefined;
}

/**
 * Valida que un componente tenga los roles ARIA correctos
 */
export function hasCorrectRole(element: { role?: string; 'aria-label'?: string }): boolean {
  return !!(element.role || element['aria-label']);
}

describe('Utilidades de accesibilidad', () => {
  describe('buildAriaDescribedBy', () => {
    it('prioriza errorId sobre helperId', () => {
      expect(buildAriaDescribedBy('helper', 'error')).toBe('error');
    });

    it('retorna helperId si no hay errorId', () => {
      expect(buildAriaDescribedBy('helper', undefined)).toBe('helper');
    });

    it('retorna undefined si no hay IDs', () => {
      expect(buildAriaDescribedBy(undefined, undefined)).toBeUndefined();
    });

    it('retorna errorId si solo hay errorId', () => {
      expect(buildAriaDescribedBy(undefined, 'error')).toBe('error');
    });
  });

  describe('hasCorrectRole', () => {
    it('retorna true si tiene role', () => {
      expect(hasCorrectRole({ role: 'button' })).toBe(true);
      expect(hasCorrectRole({ role: 'radiogroup' })).toBe(true);
    });

    it('retorna true si tiene aria-label', () => {
      expect(hasCorrectRole({ 'aria-label': 'Botón de acción' })).toBe(true);
    });

    it('retorna true si tiene ambos', () => {
      expect(hasCorrectRole({ role: 'button', 'aria-label': 'Botón' })).toBe(true);
    });

    it('retorna false si no tiene role ni aria-label', () => {
      expect(hasCorrectRole({})).toBe(false);
    });
  });

  describe('Validación de roles ARIA', () => {
    it('verifica que componentes de formulario tengan roles correctos', () => {
      const input = { role: 'textbox', 'aria-label': 'Matrícula' };
      const button = { role: 'button', 'aria-label': 'Enviar' };
      const progress = { role: 'progressbar', 'aria-valuenow': 1 };

      expect(hasCorrectRole(input)).toBe(true);
      expect(hasCorrectRole(button)).toBe(true);
      expect(hasCorrectRole(progress)).toBe(true);
    });

    it('verifica que componentes de radio tengan role="radio"', () => {
      const radio = { role: 'radio', 'aria-checked': true };
      expect(radio.role).toBe('radio');
      expect(radio['aria-checked']).toBe(true);
    });

    it('verifica que radiogroup tenga role="radiogroup"', () => {
      const radiogroup = { role: 'radiogroup', 'aria-label': 'Opciones' };
      expect(radiogroup.role).toBe('radiogroup');
    });
  });
});

