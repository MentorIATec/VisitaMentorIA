-- Crear tabla communities
CREATE TABLE IF NOT EXISTS public.communities (
  id serial PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  active boolean NOT NULL DEFAULT true
);


