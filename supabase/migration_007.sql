-- Run this in Supabase: SQL Editor > New query > paste > Run

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references rentals(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  method text not null default 'other', -- 'cash' | 'check' | 'zelle' | 'ach' | 'card' | 'other'
  notes text,
  created_at timestamptz not null default now()
);
alter table payments enable row level security;
create policy "auth full access" on payments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
grant all on payments to authenticated;

create table if not exists condition_photos (
  id uuid primary key default gen_random_uuid(),
  rental_id uuid not null references rentals(id) on delete cascade,
  stage text not null, -- 'pickup' | 'return'
  photo_path text not null,
  caption text,
  created_at timestamptz not null default now()
);
alter table condition_photos enable row level security;
create policy "auth full access" on condition_photos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
grant all on condition_photos to authenticated;

-- Private bucket (like contracts) since these are customer-specific rental records
insert into storage.buckets (id, name, public) values ('condition-photos', 'condition-photos', false)
on conflict (id) do nothing;

create policy "auth read condition photos" on storage.objects for select using (bucket_id = 'condition-photos' and auth.role() = 'authenticated');
create policy "auth upload condition photos" on storage.objects for insert with check (bucket_id = 'condition-photos' and auth.role() = 'authenticated');
create policy "auth delete condition photos" on storage.objects for delete using (bucket_id = 'condition-photos' and auth.role() = 'authenticated');
