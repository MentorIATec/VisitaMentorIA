import { describe, it, expect } from 'vitest';

const matriculaRegex = /^A\d{8,9}$/i;

describe('Validación de matrícula', () => {
  describe('Formatos válidos', () => {
    it('acepta matrícula con 8 dígitos (A00123456)', () => {
      expect(matriculaRegex.test('A00123456')).toBe(true);
    });

    it('acepta matrícula con 9 dígitos (A01234567)', () => {
      expect(matriculaRegex.test('A01234567')).toBe(true);
    });

    it('acepta matrícula con A minúscula (case-insensitive)', () => {
      expect(matriculaRegex.test('a00123456')).toBe(true);
      expect(matriculaRegex.test('a01234567')).toBe(true);
    });

    it('acepta matrícula con dígitos desde 0 hasta 9', () => {
      expect(matriculaRegex.test('A00000000')).toBe(true);
      expect(matriculaRegex.test('A99999999')).toBe(true);
      expect(matriculaRegex.test('A12345678')).toBe(true);
    });
  });

  describe('Formatos inválidos', () => {
    it('rechaza matrícula sin letra A', () => {
      expect(matriculaRegex.test('00123456')).toBe(false);
      expect(matriculaRegex.test('B00123456')).toBe(false);
    });

    it('rechaza matrícula con menos de 8 dígitos', () => {
      expect(matriculaRegex.test('A0012345')).toBe(false);
      expect(matriculaRegex.test('A001234')).toBe(false);
      expect(matriculaRegex.test('A00123')).toBe(false);
      expect(matriculaRegex.test('A0012')).toBe(false);
      expect(matriculaRegex.test('A001')).toBe(false);
      expect(matriculaRegex.test('A00')).toBe(false);
      expect(matriculaRegex.test('A0')).toBe(false);
      expect(matriculaRegex.test('A')).toBe(false);
    });

    it('rechaza matrícula con más de 9 dígitos', () => {
      expect(matriculaRegex.test('A001234567')).toBe(false);
      expect(matriculaRegex.test('A0012345678')).toBe(false);
    });

    it('rechaza matrícula con caracteres no numéricos después de A', () => {
      expect(matriculaRegex.test('A0012345A')).toBe(false);
      expect(matriculaRegex.test('A0012345 ')).toBe(false);
      expect(matriculaRegex.test('A0012345-')).toBe(false);
      expect(matriculaRegex.test('A0012345.')).toBe(false);
    });

    it('rechaza string vacío', () => {
      expect(matriculaRegex.test('')).toBe(false);
    });

    it('rechaza matrícula con espacios', () => {
      expect(matriculaRegex.test('A 00123456')).toBe(false);
      expect(matriculaRegex.test('A00123456 ')).toBe(false);
      expect(matriculaRegex.test(' A00123456')).toBe(false);
    });
  });
});

