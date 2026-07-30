-- Run this in Supabase: SQL Editor > New query > paste > Run
-- Adds a persisted notifications log and a real company settings table.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid references rentals(id) on delete cascade,
  type text not null, -- 'overdue' | 'due_soon'
  due_date date not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  unique (rental_id, due_date, type)
);

alter table notifications enable row level security;
create policy "auth full access" on notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
grant all on notifications to authenticated;

create table if not exists company_settings (
  id uuid primary key default gen_random_uuid(),
  company_name text not null default 'Your Company',
  contact_email text,
  updated_at timestamptz not null default now()
);

alter table company_settings enable row level security;
create policy "auth full access" on company_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
grant all on company_settings to authenticated;
