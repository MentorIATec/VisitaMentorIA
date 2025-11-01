-- Agregar columnas intensity y note a mood_events para nuevo flujo de emociones
-- No disruptiva: usa IF NOT EXISTS para evitar errores si ya existen

ALTER TABLE public.mood_events
  ADD COLUMN IF NOT EXISTS intensity SMALLINT,
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Comentarios para documentación
COMMENT ON COLUMN public.mood_events.intensity IS 'Intensidad 1-5 del nuevo flujo MoodFlow';
COMMENT ON COLUMN public.mood_events.note IS 'Texto libre opcional sobre qué influye en el estado emocional';

