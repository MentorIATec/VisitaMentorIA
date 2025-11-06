-- Seed de comunidades desde DATOSME_CURSOR.csv
INSERT INTO public.communities (code, name, color)
VALUES
  ('ekvilibro', 'Ekvilibro', '#6FD34A'),
  ('energio', 'Energio', '#FD8204'),
  ('forta', 'Forta', '#87004A'),
  ('krei', 'Krei', '#79858B'),
  ('kresko', 'Kresko', '#0DCCCC'),
  ('pasio', 'Pasio', '#CC0202'),
  ('reflekto', 'Reflekto', '#FFDE17'),
  ('revo', 'Revo', '#C4829A'),
  ('spirita', 'Spirita', '#5B0F8B'),
  ('talenta', 'Talenta', '#EC008C')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, active = true;

