-- Agregar community_id (FK), canal fijo 'presencial', y followup_variant en sessions

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'community_id'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN community_id integer;
  END IF;
END $$;

-- Intentar backfill desde columna antigua 'comunidad_id' si existe y si guarda el code
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'comunidad_id'
  ) THEN
    UPDATE public.sessions s
    SET community_id = c.id
    FROM public.communities c
    WHERE s.comunidad_id::text = c.code AND s.community_id IS NULL;
  END IF;
END $$;

-- Volver no nulo una vez que exista catálogo (puede fallar si no se pobló todo)
-- Se asume que nuevos inserts ya traen community_id
ALTER TABLE public.sessions
  ALTER COLUMN community_id SET NOT NULL;

-- Agregar FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND table_name = 'sessions' AND constraint_name = 'sessions_community_id_fkey'
  ) THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT sessions_community_id_fkey FOREIGN KEY (community_id)
      REFERENCES public.communities(id);
  END IF;
END $$;

-- Agregar/normalizar canal
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'channel'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN channel text;
  END IF;
END $$;

UPDATE public.sessions SET channel = 'presencial' WHERE channel IS DISTINCT FROM 'presencial';
ALTER TABLE public.sessions ALTER COLUMN channel SET DEFAULT 'presencial';
ALTER TABLE public.sessions ALTER COLUMN channel SET NOT NULL;

-- Variante de follow-up para A/B
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'followup_variant'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN followup_variant text;
  END IF;
END $$;


