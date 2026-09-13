-- Ejecutar en el SQL Editor de Supabase para activar las reservas públicas.
-- Es idempotente: se puede volver a correr sin romper nada.

-- Perfil público del negocio
alter table users add column if not exists business_slug text unique;
alter table users add column if not exists business_name text;
alter table users add column if not exists business_bio text;

-- Servicios que ofrece el negocio
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  duration_minutes int not null default 30,
  price numeric,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Horario semanal de apertura (un rango por día, sin turno partido en v1)
create table if not exists business_hours (
  user_id uuid not null references users(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = domingo ... 6 = sábado
  start_time time not null,
  end_time time not null,
  primary key (user_id, weekday)
);

-- Las reservas ahora pueden venir ligadas a un servicio concreto
alter table bookings add column if not exists service_id uuid references services(id) on delete set null;
alter table bookings add column if not exists duration_minutes int not null default 30;

-- Evita que dos personas se queden con el mismo hueco exacto a la vez
create unique index if not exists uq_bookings_user_starts_at on bookings(user_id, starts_at);

create index if not exists idx_services_user_id on services(user_id);

alter table services enable row level security;
alter table business_hours enable row level security;
