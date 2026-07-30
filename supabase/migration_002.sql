-- Run this in Supabase: SQL Editor > New query > paste > Run
-- Adds security deposit tracking, trailer status/unit number, and customer notes.

alter table trailers add column if not exists unit_number text;
alter table trailers add column if not exists status text not null default 'available';
-- status: 'available' | 'maintenance' | 'out_of_service'
-- (a trailer with an active rental is always shown as "Rented" regardless of this value)

alter table renters add column if not exists notes text;

alter table rentals add column if not exists security_deposit_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists security_deposit_status text not null default 'held';
-- security_deposit_status: 'held' | 'partially_returned' | 'returned' | 'forfeited'
alter table rentals add column if not exists security_deposit_returned_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists security_deposit_returned_date date;

alter table invoices add column if not exists invoice_number text;
