import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'node:crypto';

const matriculaRegex = /^A\d{8,9}$/;

// Función helper para calcular hash de matrícula (simula la función de DB)
function hashMatricula(matricula: string, salt: string): string {
  const normalized = matricula.toUpperCase().trim();
  return crypto.createHash('sha256').update(normalized + salt).digest('hex');
}

describe('users_map - Vinculación de matrícula', () => {
  const TEST_SALT = 'test-salt-123';
  let usersMap: Map<string, { user_id: string; matricula_hash: string }>;

  beforeEach(() => {
    usersMap = new Map();
  });

  describe('Validación de formato de matrícula', () => {
    it('acepta matrícula válida con 8 dígitos', () => {
      const matricula = 'A00123456';
      expect(matriculaRegex.test(matricula)).toBe(true);
    });

    it('acepta matrícula válida con 9 dígitos', () => {
      const matricula = 'A01234567';
      expect(matriculaRegex.test(matricula)).toBe(true);
    });

    it('rechaza matrícula inválida', () => {
      expect(matriculaRegex.test('A123456')).toBe(false); // 7 dígitos
      expect(matriculaRegex.test('A1234567890')).toBe(false); // 10 dígitos
      expect(matriculaRegex.test('B00123456')).toBe(false); // No empieza con A
      expect(matriculaRegex.test('00123456')).toBe(false); // Sin A
    });
  });

  describe('Hash de matrícula', () => {
    it('genera hash consistente para la misma matrícula', () => {
      const matricula = 'A00123456';
      const hash1 = hashMatricula(matricula, TEST_SALT);
      const hash2 = hashMatricula(matricula, TEST_SALT);
      expect(hash1).toBe(hash2);
    });

    it('genera hash diferente para matrículas diferentes', () => {
      const hash1 = hashMatricula('A00123456', TEST_SALT);
      const hash2 = hashMatricula('A00123457', TEST_SALT);
      expect(hash1).not.toBe(hash2);
    });

    it('normaliza matrícula a mayúsculas antes de hashear', () => {
      const hash1 = hashMatricula('A00123456', TEST_SALT);
      const hash2 = hashMatricula('a00123456', TEST_SALT);
      expect(hash1).toBe(hash2);
    });
  });

  describe('Vinculación de matrícula a user_id', () => {
    it('vincula matrícula a user_id correctamente', () => {
      const userId = 'azure-ad-sub-123';
      const matricula = 'A00123456';
      const matriculaHash = hashMatricula(matricula, TEST_SALT);
      
      usersMap.set(userId, { user_id: userId, matricula_hash: matriculaHash });
      
      const entry = usersMap.get(userId);
      expect(entry).toBeDefined();
      expect(entry?.user_id).toBe(userId);
      expect(entry?.matricula_hash).toBe(matriculaHash);
    });

    it('previene duplicados: misma matrícula a múltiples user_id', () => {
      const userId1 = 'azure-ad-sub-123';
      const userId2 = 'azure-ad-sub-456';
      const matricula = 'A00123456';
      const matriculaHash = hashMatricula(matricula, TEST_SALT);
      
      usersMap.set(userId1, { user_id: userId1, matricula_hash: matriculaHash });
      
      // Intentar vincular la misma matrícula a otro usuario debería fallar
      const existingEntry = Array.from(usersMap.values()).find(
        entry => entry.matricula_hash === matriculaHash
      );
      
      expect(existingEntry).toBeDefined();
      expect(existingEntry?.user_id).toBe(userId1);
      
      // No debería permitir vincular a userId2
      const canLink = !Array.from(usersMap.values()).some(
        entry => entry.matricula_hash === matriculaHash && entry.user_id !== userId2
      );
      expect(canLink).toBe(false);
    });

    it('previene duplicados: mismo user_id a múltiples matrículas', () => {
      const userId = 'azure-ad-sub-123';
      const matricula1 = 'A00123456';
      const matricula2 = 'A00123457';
      const hash1 = hashMatricula(matricula1, TEST_SALT);
      const hash2 = hashMatricula(matricula2, TEST_SALT);
      
      usersMap.set(userId, { user_id: userId, matricula_hash: hash1 });
      
      // Actualizar con nueva matrícula debería reemplazar la anterior
      usersMap.set(userId, { user_id: userId, matricula_hash: hash2 });
      
      const entry = usersMap.get(userId);
      expect(entry?.matricula_hash).toBe(hash2);
      expect(entry?.matricula_hash).not.toBe(hash1);
    });
  });

  describe('Obtención de matrícula por user_id', () => {
    it('obtiene matrícula hash por user_id', () => {
      const userId = 'azure-ad-sub-123';
      const matricula = 'A00123456';
      const matriculaHash = hashMatricula(matricula, TEST_SALT);
      
      usersMap.set(userId, { user_id: userId, matricula_hash: matriculaHash });
      
      const entry = usersMap.get(userId);
      expect(entry?.matricula_hash).toBe(matriculaHash);
    });

    it('retorna undefined si user_id no existe', () => {
      const entry = usersMap.get('non-existent-user-id');
      expect(entry).toBeUndefined();
    });
  });

  describe('Verificación de vinculación existente', () => {
    it('verifica si un usuario tiene matrícula vinculada', () => {
      const userId = 'azure-ad-sub-123';
      const matricula = 'A00123456';
      const matriculaHash = hashMatricula(matricula, TEST_SALT);
      
      usersMap.set(userId, { user_id: userId, matricula_hash: matriculaHash });
      
      const hasMatricula = usersMap.has(userId) && usersMap.get(userId)?.matricula_hash !== null;
      expect(hasMatricula).toBe(true);
    });

    it('verifica si un usuario NO tiene matrícula vinculada', () => {
      const userId = 'azure-ad-sub-123';
      const hasMatricula = usersMap.has(userId) && usersMap.get(userId)?.matricula_hash !== null;
      expect(hasMatricula).toBe(false);
    });
  });
});

