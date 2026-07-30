-- Run this whole file once in Supabase: Project > SQL Editor > New query > paste > Run

create extension if not exists "pgcrypto";

create table trailers (
  id uuid primary key default gen_random_uuid(),
  vin text not null unique,
  make text not null,
  model text not null,
  year int,
  plate text,
  notes text,
  created_at timestamptz not null default now()
);

create table renters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table rentals (
  id uuid primary key default gen_random_uuid(),
  trailer_id uuid not null references trailers(id) on delete cascade,
  renter_id uuid not null references renters(id) on delete cascade,
  start_date date not null,
  period text not null default 'monthly', -- weekly | monthly | custom
  period_days int not null default 30,
  rate numeric(10,2) not null default 0,
  status text not null default 'active', -- active | completed | cancelled
  next_due_date date not null,
  contract_url text,
  contract_filename text,
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references rentals(id) on delete cascade,
  amount numeric(10,2) not null,
  period_start date not null,
  period_end date not null,
  sent_to text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Row Level Security: only authenticated users (your single login) can read/write.
alter table trailers enable row level security;
alter table renters enable row level security;
alter table rentals enable row level security;
alter table invoices enable row level security;

create policy "auth full access" on trailers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full access" on renters for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full access" on rentals for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth full access" on invoices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage bucket for contract PDFs (create via SQL so policies apply)
insert into storage.buckets (id, name, public) values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy "auth read contracts" on storage.objects for select using (bucket_id = 'contracts' and auth.role() = 'authenticated');
create policy "auth upload contracts" on storage.objects for insert with check (bucket_id = 'contracts' and auth.role() = 'authenticated');
create policy "auth delete contracts" on storage.objects for delete using (bucket_id = 'contracts' and auth.role() = 'authenticated');
