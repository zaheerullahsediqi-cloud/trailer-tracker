-- Security deposits, trailer status/unit number, customer notes
alter table trailers add column if not exists unit_number text;
alter table trailers add column if not exists status text not null default 'available';
alter table renters add column if not exists notes text;
alter table rentals add column if not exists security_deposit_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists security_deposit_status text not null default 'held';
alter table rentals add column if not exists security_deposit_returned_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists security_deposit_returned_date date;
alter table invoices add column if not exists invoice_number text;
