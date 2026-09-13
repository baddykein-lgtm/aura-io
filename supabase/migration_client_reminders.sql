-- Recordatorios automáticos por WhatsApp a los clientes finales de cada negocio.
-- Ejecutar en el SQL Editor de Supabase.

alter table bookings add column if not exists reminder_24h_sent boolean not null default false;
alter table bookings add column if not exists reminder_2h_sent boolean not null default false;

create index if not exists idx_bookings_starts_at on bookings(starts_at);
