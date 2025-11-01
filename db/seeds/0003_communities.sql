-- Seed de comunidades (ON CONFLICT DO NOTHING)
INSERT INTO public.communities (code, name, color)
VALUES
  ('ekvilibro','ekvilibro','#6FD34A'),
  ('energio','energio','#FD8204'),
  ('forta','forta','#87004A'),
  ('krei','krei','#79858B'),
  ('kresko','kresko','#0DCCCC'),
  ('pasio','pasio','#CC0202'),
  ('reflekto','reflekto','#FFDE17'),
  ('revo','revo','#C4829A'),
  ('spirita','spirita','#5B0F8B'),
  ('talenta','talenta','#EC008C')
ON CONFLICT (code) DO NOTHING;


