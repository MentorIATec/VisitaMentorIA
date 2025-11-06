-- Eliminar mentores placeholder (Carla Mentor, Bruno Mentor, Ana Mentor)
DELETE FROM public.mentors 
WHERE display_name ILIKE '%Mentor%' 
  AND (display_name ILIKE 'Carla%' OR display_name ILIKE 'Bruno%' OR display_name ILIKE 'Ana%');

