-- Run this in Supabase: SQL Editor > New query > paste > Run

alter table trailers add column if not exists title_number text;
alter table trailers add column if not exists plate_type text;

alter table renters add column if not exists drivers_license text;
alter table renters add column if not exists date_of_birth date;

alter table company_settings add column if not exists company_address text;
