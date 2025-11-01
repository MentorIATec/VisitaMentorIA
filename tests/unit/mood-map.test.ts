import { describe, it, expect } from 'vitest';
import { mapValenceToNum, mapIntensityToEnergy, getIntensityBand, getIntensityDescriptor } from '@/lib/mood-map';

describe('mapValenceToNum', () => {
  it('mapea dificil a -3', () => {
    expect(mapValenceToNum('dificil')).toBe(-3);
  });

  it('mapea neutral a 0', () => {
    expect(mapValenceToNum('neutral')).toBe(0);
  });

  it('mapea agradable a +3', () => {
    expect(mapValenceToNum('agradable')).toBe(3);
  });
});

describe('mapIntensityToEnergy', () => {
  it('mapea intensidad 1 a -3', () => {
    expect(mapIntensityToEnergy(1)).toBe(-3);
  });

  it('mapea intensidad 2 a -1 (redondeado desde -1.5)', () => {
    expect(mapIntensityToEnergy(2)).toBe(-2);
  });

  it('mapea intensidad 3 a 0', () => {
    expect(mapIntensityToEnergy(3)).toBe(0);
  });

  it('mapea intensidad 4 a 2 (redondeado desde 1.5)', () => {
    expect(mapIntensityToEnergy(4)).toBe(2);
  });

  it('mapea intensidad 5 a +3', () => {
    expect(mapIntensityToEnergy(5)).toBe(3);
  });

  it('lanza error para intensidad fuera de rango', () => {
    expect(() => mapIntensityToEnergy(0)).toThrow();
    expect(() => mapIntensityToEnergy(6)).toThrow();
  });
});

describe('getIntensityBand', () => {
  it('retorna "baja" para intensidades 1-2', () => {
    expect(getIntensityBand(1)).toBe('baja');
    expect(getIntensityBand(2)).toBe('baja');
  });

  it('retorna "media" para intensidades 3-4', () => {
    expect(getIntensityBand(3)).toBe('media');
    expect(getIntensityBand(4)).toBe('media');
  });

  it('retorna "alta" para intensidad 5', () => {
    expect(getIntensityBand(5)).toBe('alta');
  });

  it('lanza error para intensidad fuera de rango', () => {
    expect(() => getIntensityBand(0)).toThrow();
    expect(() => getIntensityBand(6)).toThrow();
  });
});

describe('getIntensityDescriptor', () => {
  it('retorna "Suaves" para intensidades 1-2', () => {
    expect(getIntensityDescriptor(1)).toBe('Suaves');
    expect(getIntensityDescriptor(2)).toBe('Suaves');
  });

  it('retorna "Moderadas" para intensidad 3', () => {
    expect(getIntensityDescriptor(3)).toBe('Moderadas');
  });

  it('retorna "Muy intensas" para intensidades 4-5', () => {
    expect(getIntensityDescriptor(4)).toBe('Muy intensas');
    expect(getIntensityDescriptor(5)).toBe('Muy intensas');
  });

  it('lanza error para intensidad fuera de rango', () => {
    expect(() => getIntensityDescriptor(0)).toThrow();
    expect(() => getIntensityDescriptor(6)).toThrow();
  });
});

