-- ============================================================
-- Scania — Malla de Capacitación v2
-- Ejecuta este archivo en Supabase SQL Editor
-- ============================================================

-- TABLA: subcarpetas (dentro de módulos, anidables)
create table if not exists subcarpetas (
  id          uuid primary key default uuid_generate_v4(),
  modulo_id   uuid references modulos(id) on delete cascade,
  parent_id   uuid references subcarpetas(id) on delete cascade,
  nombre      text not null,
  descripcion text,
  orden       int default 0,
  created_at  timestamptz default now()
);

-- TABLA: material_subcarpeta (material dentro de subcarpetas)
create table if not exists material_subcarpeta (
  id             uuid primary key default uuid_generate_v4(),
  subcarpeta_id  uuid references subcarpetas(id) on delete cascade,
  titulo         text not null,
  tipo           text not null check (tipo in ('pdf','link')),
  url            text,
  storage_path   text,
  orden          int default 0,
  estado         text default 'activo' check (estado in ('borrador','activo')),
  tamano_mb      numeric,
  created_at     timestamptz default now()
);

-- TABLA: solicitudes_intentos
create table if not exists solicitudes_intentos (
  id              uuid primary key default uuid_generate_v4(),
  almacenero_id   uuid references almaceneros(id) on delete cascade,
  examen_id       uuid references examenes(id) on delete cascade,
  mensaje         text,
  intentos_extra  int default 0,
  estado          text default 'pendiente' check (estado in ('pendiente','aprobado','rechazado')),
  created_at      timestamptz default now()
);

-- MODIFICAR tabla examenes: agregar campos nuevos
alter table examenes
  add column if not exists nota_minima   int default 14,
  add column if not exists tiempo_limite int default 600,
  add column if not exists intentos_max  int default 2;

-- MODIFICAR tabla resultados_examenes: agregar nota vigesimal y tiempo
alter table resultados_examenes
  add column if not exists nota_vigesimal int,
  add column if not exists tiempo_segundos int,
  add column if not exists intento_numero  int default 1;

-- Deshabilitar RLS en tablas nuevas
alter table subcarpetas          disable row level security;
alter table material_subcarpeta  disable row level security;
alter table solicitudes_intentos disable row level security;

-- ============================================================
-- FIN schema_v2
-- ============================================================
