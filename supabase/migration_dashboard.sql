-- Ejecutar en el SQL Editor de Supabase antes de usar el dashboard.
-- Es idempotente: se puede volver a correr sin romper nada.

-- Login con contraseña
alter table users add column if not exists password_hash text;
alter table users add column if not exists phone text;

-- Guardar la URL del PDF para poder listar facturas pasadas en el dashboard
alter table invoices add column if not exists pdf_url text;

-- Por si alguna de estas tablas se creó sin created_at (el dashboard ordena por esta columna)
alter table invoices add column if not exists created_at timestamptz not null default now();
alter table tasks add column if not exists created_at timestamptz not null default now();
alter table contacts add column if not exists created_at timestamptz not null default now();

-- Sesiones del dashboard (login propio, no Supabase Auth)
create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- Reservas
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_name text not null,
  client_phone text,
  service text,
  starts_at timestamptz not null,
  status text not null default 'confirmada',
  notes text,
  created_at timestamptz not null default now()
);

-- Reseñas
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_name text,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_reminders_user_id on reminders(user_id);
create index if not exists idx_agenda_user_id on agenda(user_id);
create index if not exists idx_tasks_user_id on tasks(user_id);
create index if not exists idx_contacts_user_id on contacts(user_id);
create index if not exists idx_invoices_user_id on invoices(user_id);
create index if not exists idx_messages_user_id on messages(user_id);
create index if not exists idx_memories_user_id on memories(user_id);
create index if not exists idx_bookings_user_id on bookings(user_id);
create index if not exists idx_reviews_user_id on reviews(user_id);

-- El backend siempre accede con la service_role key (salta RLS), igual que el resto
-- de tablas existentes. Se activa RLS por higiene, sin políticas públicas.
alter table sessions enable row level security;
alter table bookings enable row level security;
alter table reviews enable row level security;
