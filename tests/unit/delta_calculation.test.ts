import { describe, it, expect } from 'vitest';

/**
 * Test para verificar cálculo de Δ (delta) valence/energy
 * Estos cálculos se usan en el dashboard para mostrar cambios promedio
 */

describe('Cálculo de Δ valence/energy', () => {
  it('calcula delta correctamente para valores positivos', () => {
    const valenceBefore = 2;
    const valenceAfter = 4;
    const delta = valenceAfter - valenceBefore;
    expect(delta).toBe(2);
  });

  it('calcula delta correctamente para valores negativos', () => {
    const energyBefore = -3;
    const energyAfter = -1;
    const delta = energyAfter - energyBefore;
    expect(delta).toBe(2);
  });

  it('calcula delta cuando hay cambio de negativo a positivo', () => {
    const valenceBefore = -2;
    const valenceAfter = 3;
    const delta = valenceAfter - valenceBefore;
    expect(delta).toBe(5);
  });

  it('calcula delta cuando hay cambio de positivo a negativo', () => {
    const energyBefore = 4;
    const energyAfter = -2;
    const delta = energyAfter - energyBefore;
    expect(delta).toBe(-6);
  });

  it('calcula promedio de deltas correctamente', () => {
    const deltas = [2, 1, -1, 3, 0];
    const avg = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    expect(avg).toBe(1);
  });

  it('maneja promedio cuando no hay cambios', () => {
    const deltas = [0, 0, 0];
    const avg = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    expect(avg).toBe(0);
  });

  it('calcula promedio de múltiples sesiones', () => {
    const sessions = [
      { valenceBefore: 1, valenceAfter: 3 },
      { valenceBefore: -2, valenceAfter: 0 },
      { valenceBefore: 0, valenceAfter: 2 }
    ];
    
    const deltas = sessions.map(s => s.valenceAfter - s.valenceBefore);
    const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    
    expect(deltas).toEqual([2, 2, 2]);
    expect(avgDelta).toBe(2);
  });

  it('filtra correctamente sesiones sin AFTER para cálculo', () => {
    const sessions = [
      { valenceBefore: 1, valenceAfter: 3 },
      { valenceBefore: -2, valenceAfter: null },
      { valenceBefore: 0, valenceAfter: 2 }
    ];
    
    const validSessions = sessions.filter(s => s.valenceAfter !== null);
    const deltas = validSessions.map(s => (s.valenceAfter as number) - s.valenceBefore);
    const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    
    expect(validSessions.length).toBe(2);
    expect(avgDelta).toBe(2);
  });
});

