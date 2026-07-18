-- Run this in Supabase: SQL Editor > New query > paste > Run
-- Down payment tracking as its own line item, separate from the security deposit.

alter table rentals add column if not exists down_payment_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists down_payment_status text not null default 'not_collected';
-- down_payment_status: 'not_collected' | 'partially_collected' | 'collected'
alter table rentals add column if not exists down_payment_collected_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists down_payment_collected_date date;
