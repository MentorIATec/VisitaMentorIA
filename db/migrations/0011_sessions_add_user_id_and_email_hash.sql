-- Agregar user_id (opcional, para sesiones SSO)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN user_id TEXT;
  END IF;
END $$;

-- Agregar email_hash (opcional, hash de email para SSO)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'email_hash'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN email_hash TEXT;
  END IF;
END $$;

-- Índices para user_id
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_email_hash ON public.sessions(email_hash);

-- FK opcional a users_map
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'sessions' AND constraint_name = 'sessions_user_id_fkey'
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id)
      REFERENCES public.users_map(user_id) ON DELETE SET NULL;
  END IF;
END $$;

