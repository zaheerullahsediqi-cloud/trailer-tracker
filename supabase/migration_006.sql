alter table rentals add column if not exists down_payment_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists down_payment_status text not null default 'not_collected';
alter table rentals add column if not exists down_payment_collected_amount numeric(10,2) not null default 0;
alter table rentals add column if not exists down_payment_collected_date date;
