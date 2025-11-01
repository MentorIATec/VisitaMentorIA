-- Agregar email y followup_sent_at a sessions para seguimiento por correo

-- Email opcional para envío de follow-up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN email text;
  END IF;
END $$;

-- Timestamp de cuando se envió el correo de follow-up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'followup_sent_at'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN followup_sent_at timestamp with time zone;
  END IF;
END $$;

-- Índice para consultas del cron job
CREATE INDEX IF NOT EXISTS idx_sessions_followup_pending 
  ON public.sessions(consent_followup, followup_variant, followup_sent_at, created_at)
  WHERE consent_followup = true AND followup_variant IS NOT NULL AND followup_sent_at IS NULL;

