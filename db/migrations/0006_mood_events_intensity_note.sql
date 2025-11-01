-- Migración no disruptiva: agregar columnas intensity y note a mood_events
-- Compatible con datos existentes (columnas nullable)

ALTER TABLE public.mood_events 
  ADD COLUMN IF NOT EXISTS intensity SMALLINT,
  ADD COLUMN IF NOT EXISTS note TEXT;

COMMENT ON COLUMN public.mood_events.intensity IS 'Intensidad emocional (1-5) capturada en el nuevo flujo MoodFlow';
COMMENT ON COLUMN public.mood_events.note IS 'Nota libre del usuario sobre qué influye en su estado emocional';

