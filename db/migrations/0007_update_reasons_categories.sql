-- Migración para actualizar razones con nuevas categorías y deprecar las legacy
-- Nota: Esta migración es opcional si quieres mantener compatibilidad completa
-- Las razones legacy (TRAMITES, CARGA, EMOCIONAL) seguirán funcionando
-- pero se redirigen automáticamente en el frontend

-- Si necesitas agregar nuevas razones en la BD, descomenta y ajusta según tu esquema:
/*
INSERT INTO reasons(code, label, active) VALUES
  ('AUTOCONOCIMIENTO', 'Autoconocimiento y crecimiento personal', true),
  ('ORGANIZACION', 'Organización y gestión del tiempo', true),
  ('MOTIVACION', 'Motivación o enfoque académico', true),
  ('ESTUDIO', 'Estrategias de estudio y concentración', true),
  ('EQUILIBRIO_ACA', 'Equilibrio académico–personal', true)
ON CONFLICT (code) DO NOTHING;

-- Actualizar labels existentes
UPDATE reasons SET label = 'Propósito de vida, metas o dudas vocacionales' WHERE code = 'PROPOSITO';
UPDATE reasons SET label = 'Hábitos y equilibrio personal (sueño, descanso, salud, rutinas)' WHERE code = 'HABITOS';
UPDATE reasons SET label = 'Adaptación, pertenencia y participación en comunidad' WHERE code = 'INTEGRACION';
UPDATE reasons SET label = 'Becas, idiomas, movilidad u otros programas' WHERE code = 'OPORTUNIDADES';
UPDATE reasons SET label = 'Canalización / derivación a otras áreas' WHERE code = 'CANALIZACION';
UPDATE reasons SET label = 'Otro / seguimiento general' WHERE code = 'OTRO';

-- Marcar razones legacy como inactivas (opcional - el frontend las maneja automáticamente)
-- UPDATE reasons SET active = false WHERE code IN ('TRAMITES', 'CARGA', 'EMOCIONAL', 'ACADEMICO');
*/

-- Nota: Esta migración es principalmente para referencia
-- El sistema funciona con el mapeo en código (lib/reason-categories.ts)
-- que maneja automáticamente las redirecciones y dimensiones de bienestar
