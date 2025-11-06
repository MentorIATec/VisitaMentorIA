-- Agregar columnas de contacto a la tabla mentors
ALTER TABLE public.mentors
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS instagram text;

