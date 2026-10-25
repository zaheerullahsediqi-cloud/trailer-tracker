-- Apply after schema.sql and legacy migrations 002 through 015.
-- Inventory import is deliberately separate: this migration inserts no fleet records.
begin;
alter table public.trailers add column inventory_category text not null default 'under_mc'
  check (inventory_category in ('under_mc','pending_insurance'));
alter table public.trailers add column inventory_renter_name text;
alter table public.trailers add column source_record jsonb;

drop policy if exists "auth upload trailer photos" on storage.objects;
drop policy if exists "auth update trailer photos" on storage.objects;
drop policy if exists "auth delete trailer photos" on storage.objects;
create policy tracker_photo_insert on storage.objects for insert to authenticated
  with check (bucket_id='trailer-photos' and public.tracker_admin());
create policy tracker_photo_update on storage.objects for update to authenticated
  using (bucket_id='trailer-photos' and public.tracker_admin())
  with check (bucket_id='trailer-photos' and public.tracker_admin());
create policy tracker_photo_delete on storage.objects for delete to authenticated
  using (bucket_id='trailer-photos' and public.tracker_admin());

create function public.guard_inventory_rental() returns trigger language plpgsql
set search_path=public as $$
declare t trailers; assigned_name text;
begin
  if TG_OP='UPDATE' then
    if old.status='completed' and new.status='active' then
      raise exception 'Completed rental history is preserved. Create a new agreement to resume service.';
    end if;
    if new.trailer_id<>old.trailer_id or new.renter_id<>old.renter_id then
      raise exception 'Rental parties and trailer are preserved. Create a new agreement instead.';
    end if;
  end if;
  if new.status='active' then
    select * into t from trailers where id=new.trailer_id for update;
    if t.inventory_category='pending_insurance' then
      raise exception 'Clear pending insurance before creating a rental.';
    end if;
    if t.inventory_renter_name is not null then
      select name into assigned_name from renters where id=new.renter_id;
      if assigned_name is distinct from t.inventory_renter_name then
        raise exception 'Choose the assigned renter (%) to complete inventory setup.',t.inventory_renter_name;
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger inventory_rental_guard before insert or update on public.rentals
for each row execute function public.guard_inventory_rental();

create function public.clear_inventory_assignment() returns trigger language plpgsql
set search_path=public as $$
begin
  if new.status='active' then
    update trailers set inventory_renter_name=null where id=new.trailer_id and inventory_renter_name is not null;
  end if;
  return new;
end $$;
create trigger inventory_assignment_complete after insert on public.rentals
for each row execute function public.clear_inventory_assignment();

create function public.guard_inventory_trailer() returns trigger language plpgsql
set search_path=public as $$
begin
  if TG_OP='UPDATE' then
    if new.source_record is distinct from old.source_record then
      raise exception 'The original import source is preserved for comparison.';
    end if;
  end if;
  if new.inventory_category='pending_insurance' and
      (new.inventory_renter_name is not null or exists(select 1 from rentals where trailer_id=new.id and status='active')) then
    raise exception 'Complete the rental assignment before changing this trailer to pending insurance.';
  end if;
  if new.status='sold' and new.inventory_renter_name is not null then
    raise exception 'Resolve the imported rental assignment before recording a sale.';
  end if;
  return new;
end $$;
create trigger inventory_trailer_guard before insert or update on public.trailers
for each row execute function public.guard_inventory_trailer();

-- SECURITY INVOKER: caller's table RLS applies; only administrators may import.
-- VIN uniqueness handles concurrent imports; existing records are never updated.
create function public.import_fleet_inventory(p_records jsonb) returns jsonb language plpgsql
set search_path=public as $$
declare item jsonb; affected integer; added integer:=0; skipped integer:=0;
begin
  if not public.tracker_admin() then raise exception 'Administrator access required'; end if;
  if jsonb_typeof(p_records) is distinct from 'array' then raise exception 'Expected an inventory array'; end if;
  if jsonb_array_length(p_records)>100 then raise exception 'Import is limited to 100 records'; end if;
  for item in select value from jsonb_array_elements(p_records) loop
    if coalesce(trim(item->>'vin'),'')='' or coalesce(trim(item->>'make'),'')='' or coalesce(trim(item->>'model'),'')='' then
      raise exception 'VIN, make and model are required';
    end if;
    if item->>'status' not in ('available','sold') then raise exception 'Invalid import availability'; end if;
    insert into trailers(vin,make,model,year,plate,unit_number,status,inventory_category,inventory_renter_name,buyer_name,sold_date,source_record,trailer_type)
    values(item->>'vin',item->>'make',item->>'model',(item->>'year')::integer,item->>'plate',item->>'unit_number',
      item->>'status',item->>'inventory_category',item->>'inventory_renter_name',item->>'buyer_name',(item->>'sold_date')::date,
      item->'source_record',case when item->>'model'='Step deck' then 'Step Deck' else 'Flatbed' end)
    on conflict(vin) do nothing;
    get diagnostics affected=row_count;
    if affected=1 then added:=added+1; else skipped:=skipped+1; end if;
  end loop;
  return jsonb_build_object('inserted',added,'skipped',skipped);
end $$;
revoke all on function public.import_fleet_inventory(jsonb) from public;
grant execute on function public.import_fleet_inventory(jsonb) to authenticated;
revoke all on function public.guard_inventory_rental() from public;
revoke all on function public.clear_inventory_assignment() from public;
revoke all on function public.guard_inventory_trailer() from public;
commit;
