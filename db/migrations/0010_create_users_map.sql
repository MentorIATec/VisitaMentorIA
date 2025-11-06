-- Tabla users_map: vincula user_id de Azure AD con matrícula
CREATE TABLE IF NOT EXISTS public.users_map (
  user_id TEXT PRIMARY KEY, -- sub de Azure AD
  matricula_hash TEXT NOT NULL, -- hash de matrícula usando hash_matricula()
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_map_matricula_hash_unique UNIQUE (matricula_hash)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_map_matricula_hash ON public.users_map(matricula_hash);
CREATE INDEX IF NOT EXISTS idx_users_map_user_id ON public.users_map(user_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_users_map_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_map_updated_at
  BEFORE UPDATE ON public.users_map
  FOR EACH ROW
  EXECUTE FUNCTION update_users_map_updated_at();

