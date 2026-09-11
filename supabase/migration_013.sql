-- Run this in Supabase: SQL Editor > New query > paste > Run

alter table trailers add column if not exists trailer_type text;
alter table trailers add column if not exists last_service_date date;
