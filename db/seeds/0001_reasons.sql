insert into reasons(code, label, active) values
('ACADEMICO', 'Académico: organización/estudio', true),
('EMOCIONAL', 'Acompañamiento emocional', true),
('TRAMITES', 'Trámites/administrativo', true),
('CARGA', 'Planeación de carga/semestre', true),
('PROPOSITO', 'Dudas de carrera/propósito', true),
('HABITOS', 'Hábitos y bienestar', true),
('INTEGRACION', 'Integración/comunidad', true),
('CANALIZACION', 'Canalización/derivación', true),
('OPORTUNIDADES', 'Oportunidades (idiomas/becas)', true),
('OTRO', 'Otro', true)
on conflict (code) do nothing;
