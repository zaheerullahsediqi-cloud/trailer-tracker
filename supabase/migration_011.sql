-- Run this in Supabase: SQL Editor > New query > paste > Run
-- Fixes the "Reactivate" button: migration_010's guard_rental() trigger
-- currently blocks ANY completed -> active transition outright. That's
-- redundant with the trailer-availability check already in the same
-- function (a few lines above), which correctly stops you from
-- reactivating onto a trailer that already has a different active rental.
-- This replaces the function to drop only that one over-broad rule, and
-- clears end_date when a rental is reactivated so its state fully
-- reflects "active" again. Everything else in the trigger — the delete
-- block, invalid-terms checks, and the historical-billing-terms
-- protection — is unchanged.

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
    if new.status='active' and old.status='completed' then
      if exists(select 1 from rentals where trailer_id=new.trailer_id and status='active' and id<>new.id) then
        raise exception 'This trailer already has another active rental. Complete that one first, or reactivate a different rental instead.';
      end if;
      new.end_date=null;
    end if;
  end if;
  return new;
end $$;
