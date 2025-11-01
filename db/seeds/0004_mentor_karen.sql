-- Insertar/actualizar mentora Karen con comunidad 'talenta'
WITH c AS (
  SELECT id FROM public.communities WHERE code = 'talenta'
)
INSERT INTO public.mentors (email, display_name, campus, comunidad_id)
SELECT 'kareng@tec.mx', 'Karen Ariadna Guzmán Vega', 'MTY', c.id FROM c
ON CONFLICT (email) DO UPDATE
SET display_name = EXCLUDED.display_name,
    campus = EXCLUDED.campus,
    comunidad_id = EXCLUDED.comunidad_id;


