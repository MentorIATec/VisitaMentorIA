insert into mentors(email, display_name, campus, comunidad_id)
values
('kareng@tec.mx', 'Karen Ariadna Guzmán Vega', 'MTY', 'KREI')
on conflict (email) do nothing;
