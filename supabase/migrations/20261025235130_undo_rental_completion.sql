-- Undo an accidental completion on the same agreement. No history table or
-- correction row is created. A short note is saved only when explicitly chosen.
begin;

create or replace function public.guard_inventory_rental() returns trigger
language plpgsql set search_path=public as $$
declare t trailers; assigned_name text;
begin
  if TG_OP='UPDATE' then
    if old.status='completed' and new.status='active' then
      if current_setting('trailer_tracker.undo_rental_id',true) is distinct from old.id::text
         or not coalesce(public.tracker_admin(),false) then
        raise exception 'Completed rental history is preserved. Use Undo completion for a mistake, or create a new agreement for returning service.';
      end if;
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

-- SECURITY INVOKER: RLS and all rental/trailer guards remain enabled.
create function public.undo_rental_completion(p_rental_id uuid, p_save_note boolean default false)
returns public.rentals language plpgsql set search_path=public as $$
declare r rentals; t trailers; restored rentals; target_trailer uuid;
  previous_context text;
begin
  if auth.uid() is null or not coalesce(public.tracker_admin(),false) then
    raise exception 'Only an administrator can undo completion.';
  end if;
  select trailer_id into target_trailer from rentals where id=p_rental_id;
  if not found then raise exception 'Rental not found.'; end if;
  -- Lock the trailer before checking occupancy. New rental creation locks this
  -- same row, and the unique active-rental index is an additional safeguard.
  select * into t from trailers where id=target_trailer for update;
  select * into r from rentals where id=p_rental_id for update;
  if r.status is distinct from 'completed' then raise exception 'This rental is already active.'; end if;
  if r.end_date is null then raise exception 'This historical rental has no completion date. Review its dates before making a correction.'; end if;
  if t.status is distinct from 'available' then raise exception 'The trailer must be available before undoing completion.'; end if;
  if t.inventory_category='pending_insurance' then raise exception 'Clear pending insurance before undoing completion.'; end if;
  if t.inventory_renter_name is not null then raise exception 'Resolve the new renter assignment before undoing this completion.'; end if;
  if exists(select 1 from rentals where trailer_id=r.trailer_id and id<>r.id and status='active') then
    raise exception 'Another rental is already active for this trailer.';
  end if;
  if exists(select 1 from rentals where trailer_id=r.trailer_id and id<>r.id
      and (created_at>r.created_at or start_date>r.start_date)) then
    raise exception 'A newer agreement exists. Only the latest rental completion can be undone.';
  end if;

  previous_context:=coalesce(current_setting('trailer_tracker.undo_rental_id',true),'');
  perform set_config('trailer_tracker.undo_rental_id',r.id::text,true);
  update rentals set status='active', end_date=null,
    completion_note=case when coalesce(p_save_note,false) then
      concat_ws(E'\n',nullif(r.completion_note,''),
        'Completion undone on '||to_char(current_timestamp at time zone 'UTC','YYYY-MM-DD HH24:MI')||' UTC.')
      else r.completion_note end
    where id=r.id returning * into restored;
  perform set_config('trailer_tracker.undo_rental_id',previous_context,true);
  return restored;
end $$;
revoke all on function public.undo_rental_completion(uuid,boolean) from public;
grant execute on function public.undo_rental_completion(uuid,boolean) to authenticated;
revoke all on function public.guard_inventory_rental() from public;
commit;
