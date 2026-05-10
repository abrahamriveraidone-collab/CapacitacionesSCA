-- ============================================================
-- Scania — Malla de Capacitación de Almacenes
-- Schema SQL para Supabase
-- Ejecuta este archivo completo en el SQL Editor de Supabase
-- ============================================================

-- EXTENSIONES
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: sucursales
-- ============================================================
create table if not exists sucursales (
  id          uuid primary key default uuid_generate_v4(),
  codigo      text not null unique,
  nombre      text not null,
  region      text not null check (region in ('Norte','Sur','Centro','Minería')),
  ciudad      text,
  tipo        text default 'Taller',
  archivada   boolean default false,
  created_at  timestamptz default now()
);

insert into sucursales (codigo, nombre, region, ciudad) values
  ('S10', 'S10 — Trujillo',      'Norte',   'Trujillo'),
  ('S06', 'S06 — Arequipa',      'Sur',      'Arequipa'),
  ('S08', 'S08 — Shahuindo',     'Minería',  'Cajamarca'),
  ('S14', 'S14 — Shougang',      'Minería',  'Ica'),
  ('S11', 'S11 — La Victoria',   'Centro',   'Lima'),
  ('S25', 'S25 — Piura',         'Norte',    'Piura'),
  ('S19', 'S19 — Huancayo',      'Centro',   'Huancayo'),
  ('S32', 'S32 — PDI',           'Centro',   'Lima');

-- ============================================================
-- TABLA: almaceneros
-- ============================================================
create table if not exists almaceneros (
  id            uuid primary key default uuid_generate_v4(),
  codigo        text not null unique,
  nombre        text not null,
  email         text,
  telefono      text,
  puesto        text default 'Técnico de Almacén',
  sucursal_id   uuid references sucursales(id),
  region        text,
  archivado     boolean default false,
  created_at    timestamptz default now()
);

insert into almaceneros (codigo, nombre, email, puesto, region) values
  ('AFL9FU', 'Abraham Flores Vilcarano',  'abraham.flores@scania.com',  'Asesor Interno de Servicios', 'Centro'),
  ('ONU52V', 'Olenka Nuñez Castro',       'olenka.nunez@scania.com',    'Técnico de Almacén',          'Norte'),
  ('MMOKB3', 'Moises Moya Rufino',        'moises.moya@scania.com',     'Técnico de Almacén',          'Centro'),
  ('JORU3',  'Juan Carlos Apaza',         'juan.apaza@scania.com',      'Técnico de Almacén',          'Sur'),
  ('WBA0N',  'Wagner Bautista Saavedra',  'wagner.bautista@scania.com', 'Técnico de Almacén',          'Minería'),
  ('EMSNX',  'Eliany Mauricio Cruz',      'eliany.mauricio@scania.com', 'Técnico de Almacén',          'Norte'),
  ('CBOZD6', 'Claudia Bonifaz',           'claudia.bonifaz@scania.com', 'Asistente de Servicio',       'Centro'),
  ('EQU2VY', 'Edgar Quispe',              'edgar.quispe@scania.com',    'Técnico de Almacén',          'Minería');

-- ============================================================
-- TABLA: modulos
-- ============================================================
create table if not exists modulos (
  id          uuid primary key default uuid_generate_v4(),
  titulo      text not null,
  categoria   text not null,
  descripcion text,
  icono       text default '⚙',
  color       text default '#041E42',
  imagen_url  text,
  estado      text default 'borrador' check (estado in ('borrador','publicado')),
  orden       int default 0,
  archivado   boolean default false,
  created_at  timestamptz default now()
);

insert into modulos (titulo, categoria, descripcion, icono, color, estado, orden) values
  ('Automaster',              'Sistema',     'Generación y seguimiento de pedidos en el sistema Automaster.',       '⚙',  '#041E42', 'publicado', 1),
  ('Recepción de Mercadería', 'Operaciones', 'Procesos de ingreso, verificación y control de mercadería.',          '📦', '#1a2f4a', 'publicado', 2),
  ('Control de Picking',      'Operaciones', 'Picking taller y mostrador, control de salidas.',                     '🔍', '#2D3340', 'publicado', 3),
  ('Inventarios Cíclicos',    'Inventario',  'Conteo, plantillas de diferencias y solicitud de ajuste.',            '📋', '#1f3a5c', 'publicado', 4),
  ('Control de Cores',        'Calidad',     'Gestión de retornables y devolución de cores.',                       '♻️', '#3D2B1F', 'publicado', 5),
  ('DSM Parts',               'Reportes',    'KPIs y gestión de stock obsoleto.',                                   '📊', '#1C3A2A', 'publicado', 6),
  ('Compra de Lubricantes',   'Compras',     'Ingreso de facturas y pedidos de lubricantes.',                       '🛢️','#243347', 'publicado', 7),
  ('Service Exchange',        'Servicios',   'Devolución de cores y generación de intercambio.',                    '🔄', '#3A1C1C', 'publicado', 8);

-- ============================================================
-- TABLA: lecciones
-- ============================================================
create table if not exists lecciones (
  id          uuid primary key default uuid_generate_v4(),
  modulo_id   uuid references modulos(id) on delete cascade,
  titulo      text not null,
  tipo        text not null check (tipo in ('pdf','video','link')),
  url         text,
  storage_path text,
  orden       int default 0,
  archivada   boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: material
-- ============================================================
create table if not exists material (
  id            uuid primary key default uuid_generate_v4(),
  titulo        text not null,
  tipo          text not null check (tipo in ('pdf','link')),
  url           text,
  storage_path  text,
  modulo_id     uuid references modulos(id),
  estado        text default 'borrador' check (estado in ('borrador','activo')),
  archivado     boolean default false,
  tamano_mb     numeric,
  created_at    timestamptz default now()
);

-- ============================================================
-- TABLA: examenes
-- ============================================================
create table if not exists examenes (
  id          uuid primary key default uuid_generate_v4(),
  titulo      text not null,
  modulo_id   uuid references modulos(id),
  estado      text default 'borrador' check (estado in ('borrador','activo')),
  archivado   boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: preguntas
-- ============================================================
create table if not exists preguntas (
  id          uuid primary key default uuid_generate_v4(),
  examen_id   uuid references examenes(id) on delete cascade,
  texto       text not null,
  opcion_a    text not null,
  opcion_b    text not null,
  opcion_c    text not null,
  opcion_d    text not null,
  correcta    text not null check (correcta in ('a','b','c','d')),
  orden       int default 0
);

-- ============================================================
-- TABLA: progreso
-- Guarda el avance de cada almacenero por módulo
-- ============================================================
create table if not exists progreso (
  id              uuid primary key default uuid_generate_v4(),
  almacenero_id   uuid references almaceneros(id) on delete cascade,
  modulo_id       uuid references modulos(id) on delete cascade,
  porcentaje      int default 0 check (porcentaje >= 0 and porcentaje <= 100),
  completado      boolean default false,
  updated_at      timestamptz default now(),
  unique(almacenero_id, modulo_id)
);

-- ============================================================
-- TABLA: resultados_examenes
-- Guarda cada intento de examen (auto-guardado)
-- ============================================================
create table if not exists resultados_examenes (
  id              uuid primary key default uuid_generate_v4(),
  almacenero_id   uuid references almaceneros(id) on delete cascade,
  examen_id       uuid references examenes(id) on delete cascade,
  modulo_id       uuid references modulos(id),
  puntaje         int not null check (puntaje >= 0 and puntaje <= 100),
  aprobado        boolean not null,
  respuestas      jsonb,
  created_at      timestamptz default now()
);

-- ============================================================
-- TABLA: lecciones_vistas
-- Registra qué lecciones vio cada almacenero
-- ============================================================
create table if not exists lecciones_vistas (
  id              uuid primary key default uuid_generate_v4(),
  almacenero_id   uuid references almaceneros(id) on delete cascade,
  leccion_id      uuid references lecciones(id) on delete cascade,
  created_at      timestamptz default now(),
  unique(almacenero_id, leccion_id)
);

-- ============================================================
-- STORAGE BUCKET para PDFs
-- ============================================================
insert into storage.buckets (id, name, public)
values ('material-pdfs', 'material-pdfs', true)
on conflict do nothing;

-- ============================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table sucursales          enable row level security;
alter table almaceneros         enable row level security;
alter table modulos             enable row level security;
alter table lecciones           enable row level security;
alter table material            enable row level security;
alter table examenes            enable row level security;
alter table preguntas           enable row level security;
alter table progreso            enable row level security;
alter table resultados_examenes enable row level security;
alter table lecciones_vistas    enable row level security;

-- Lectura pública (almaceneros sin login pueden leer contenido publicado)
create policy "Lectura publica modulos"    on modulos    for select using (estado = 'publicado' and not archivado);
create policy "Lectura publica lecciones"  on lecciones  for select using (not archivada);
create policy "Lectura publica material"   on material   for select using (estado = 'activo' and not archivado);
create policy "Lectura publica examenes"   on examenes   for select using (estado = 'activo' and not archivado);
create policy "Lectura publica preguntas"  on preguntas  for select using (true);
create policy "Lectura publica almaceneros" on almaceneros for select using (not archivado);
create policy "Lectura publica sucursales" on sucursales for select using (not archivada);

-- Progreso: cualquiera puede insertar/actualizar (se identifica por almacenero_id)
create policy "Insertar progreso"   on progreso            for insert with check (true);
create policy "Actualizar progreso" on progreso            for update using (true);
create policy "Leer progreso"       on progreso            for select using (true);
create policy "Insertar resultado"  on resultados_examenes for insert with check (true);
create policy "Leer resultados"     on resultados_examenes for select using (true);
create policy "Insertar vista"      on lecciones_vistas    for insert with check (true);
create policy "Leer vistas"         on lecciones_vistas    for select using (true);

-- Storage: lectura pública de PDFs
create policy "PDFs publicos" on storage.objects
  for select using (bucket_id = 'material-pdfs');
create policy "Admin sube PDFs" on storage.objects
  for insert with check (bucket_id = 'material-pdfs');

-- ============================================================
-- FIN DEL SCHEMA
-- ============================================================
