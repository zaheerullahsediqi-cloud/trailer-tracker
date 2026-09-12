-- Run this in Supabase: SQL Editor > New query > paste > Run

alter table company_settings add column if not exists city text;
alter table company_settings add column if not exists state text;
alter table company_settings add column if not exists zip text;
alter table company_settings add column if not exists phone text;
alter table company_settings add column if not exists website text;
alter table company_settings add column if not exists invoice_footer text;
