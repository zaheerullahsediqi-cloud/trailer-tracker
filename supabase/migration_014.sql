-- Run this in Supabase: SQL Editor > New query > paste > Run

alter table trailers add column if not exists length_ft numeric(6,1);
alter table trailers add column if not exists capacity_lbs numeric(10,0);
alter table trailers add column if not exists sold_date date;
alter table trailers add column if not exists sold_price numeric(10,2);
alter table trailers add column if not exists buyer_name text;
alter table trailers add column if not exists sold_note text;
