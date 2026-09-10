-- Apply after migrations 002,003,005,006,007,008,009. Entire migration is atomic.
begin;
-- Stop rather than silently choose a winner for existing double bookings.
do $$ begin
 if exists(select 1 from rentals where status='active' group by trailer_id having count(*)>1) then
  raise exception 'Resolve duplicate active rentals before migration 010. No data was changed.';
 end if;
end $$;
create unique index if not exists one_active_rental_per_trailer on rentals(trailer_id) where status='active';
alter table rentals add column if not exists end_date date;
alter table rentals add column if not exists completion_note text;
alter table rentals drop constraint if exists rentals_trailer_id_fkey;
alter table rentals add constraint rentals_trailer_id_fkey foreign key(trailer_id) references trailers(id) on delete restrict;
alter table rentals drop constraint if exists rentals_renter_id_fkey;
alter table rentals add constraint rentals_renter_id_fkey foreign key(renter_id) references renters(id) on delete restrict;
create or replace function guard_rental() returns trigger language plpgsql set search_path=public as $$
declare trailer_status text;
begin
 if TG_OP='DELETE' then raise exception 'Rental history is preserved. Mark the rental completed instead.'; end if;
 if new.status not in ('active','completed') or new.period not in ('weekly','monthly','semiannual','annual','custom') or new.period_days<=0 or new.rate<0 or new.rate='NaN'::numeric then raise exception 'Invalid rental terms'; end if;
 if new.status='active' then
   select status into trailer_status from trailers where id=new.trailer_id for update;
   if trailer_status is distinct from 'available' then raise exception 'Trailer must be available before creating or reactivating a rental'; end if;
 end if;
 if TG_OP='UPDATE' then
   if new.start_date<>old.start_date or new.rate<>old.rate or new.period<>old.period or new.period_days<>old.period_days then
     if exists(select 1 from invoices where rental_id=old.id) or exists(select 1 from payments where rental_id=old.id) or old.start_date<current_date then
       raise exception 'Historical billing terms are preserved. Complete this rental and create a new agreement to change the rate or period.';
     end if;
   end if;
   if new.status='completed' and old.status='active' then new.end_date=current_date; end if;
   if new.status='active' and old.status='completed' then raise exception 'Completed rental history is preserved. Create a new rental to resume.'; end if;
 end if;
 return new;
end $$;
create trigger rental_guard before insert or update or delete on rentals for each row execute function guard_rental();
create or replace function guard_trailer_status() returns trigger language plpgsql set search_path=public as $$
begin
 if new.status not in ('available','maintenance','out_of_service','sold') then raise exception 'Invalid trailer status'; end if;
 if new.status<>'available' and exists(select 1 from rentals where trailer_id=new.id and status='active') then raise exception 'Complete the active rental before taking this trailer out of service'; end if;
 return new;
end $$;
create trigger trailer_status_guard before update on trailers for each row execute function guard_trailer_status();
alter table payments add constraint positive_payment check(amount>0 and amount<100000000 and amount<>'NaN'::numeric) not valid;
alter table rentals add constraint valid_deposits check(security_deposit_amount>=0 and security_deposit_amount<100000000 and security_deposit_returned_amount between 0 and security_deposit_amount and down_payment_amount>=0 and down_payment_amount<100000000 and down_payment_collected_amount between 0 and down_payment_amount) not valid;
alter table invoices add column if not exists delivery_key text;
alter table invoices add column if not exists delivery_status text not null default 'sent';
alter table invoices add column if not exists delivery_error text;
alter table invoices add column if not exists email_id text;
alter table invoices add column if not exists snapshot jsonb;
create unique index if not exists invoice_delivery_key on invoices(delivery_key) where delivery_key is not null;
create sequence if not exists invoice_number_seq;
grant usage on sequence invoice_number_seq to authenticated;
create or replace function reserve_invoice(p_rental_id uuid, p_snapshot jsonb) returns invoices language plpgsql set search_path=public as $$
declare r rentals; inv invoices; key text; next_end date; i integer := 1; step_months integer;
begin
 select * into r from rentals where id=p_rental_id for update;
 if not found then raise exception 'Rental not found'; end if;
 key := r.id::text || ':' || r.next_due_date::text;
 select * into inv from invoices where delivery_key=key or (rental_id=r.id and period_start=r.next_due_date and sent_at is not null) order by created_at limit 1;
 if found then return inv; end if;
 step_months := case r.period when 'monthly' then 1 when 'semiannual' then 6 when 'annual' then 12 else null end;
 loop
   next_end := case when step_months is not null then (r.start_date + make_interval(months => step_months*i))::date else r.start_date+r.period_days*i end;
   exit when next_end>r.next_due_date;
   i := i+1;
   if i>100000 then raise exception 'Invalid invoice schedule'; end if;
 end loop;
 insert into invoices(rental_id,invoice_number,amount,period_start,period_end,sent_to,delivery_key,delivery_status,snapshot)
 values(r.id,'INV-'||lpad(nextval('invoice_number_seq')::text,8,'0'),r.rate,r.next_due_date,next_end,p_snapshot->'renters'->>'email',key,'pending',p_snapshot) returning * into inv;
 return inv;
end $$;
revoke all on function reserve_invoice(uuid,jsonb) from public;
grant execute on function reserve_invoice(uuid,jsonb) to authenticated;
-- Existing users keep their trusted-team access. New accounts default to read-only.
update auth.users set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"trailer_tracker_role":"admin"}'::jsonb where not coalesce(raw_app_meta_data,'{}'::jsonb) ? 'trailer_tracker_role';
create or replace function tracker_admin() returns boolean language sql stable security definer set search_path=public as $$
 select auth.role()='service_role' or exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'trailer_tracker_role'='admin');
$$;
revoke all on function tracker_admin() from public;
grant execute on function tracker_admin() to authenticated, service_role;
do $$ declare t text; p record; begin
 foreach t in array array['trailers','renters','rentals','invoices','payments','condition_photos','company_settings','notifications'] loop
   for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
     execute format('drop policy %I on %I',p.policyname,t);
   end loop;
   execute format('create policy tracker_read on %I for select to authenticated using (true)',t);
   execute format('create policy tracker_write on %I for all to authenticated using (tracker_admin()) with check (tracker_admin())',t);
 end loop;
 -- Notification read/dismiss state is shared, as in the original app.
end $$;
do $$ declare p record; begin
 for p in select policyname from pg_policies where schemaname='storage' and tablename='objects' and policyname = any(array['auth upload contracts','auth delete contracts','auth upload documents','auth update documents','auth delete documents','auth upload branding','auth update branding','auth delete branding','auth upload condition photos','auth delete condition photos']) loop
   if p.policyname ~ '(upload|update|delete)' then execute format('drop policy %I on storage.objects',p.policyname); end if;
 end loop;
end $$;
create policy tracker_storage_insert on storage.objects for insert to authenticated with check(bucket_id in ('contracts','documents','branding','condition-photos') and public.tracker_admin());
create policy tracker_storage_update on storage.objects for update to authenticated using(bucket_id in ('contracts','documents','branding','condition-photos') and public.tracker_admin()) with check(bucket_id in ('contracts','documents','branding','condition-photos') and public.tracker_admin());
create policy tracker_storage_delete on storage.objects for delete to authenticated using(bucket_id in ('contracts','documents','branding','condition-photos') and public.tracker_admin());
commit;
