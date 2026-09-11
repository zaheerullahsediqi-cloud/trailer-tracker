-- Run this in Supabase: SQL Editor > New query > paste > Run

alter table trailers add column if not exists photo_url text;

-- Public bucket (like branding) since trailer photos appear as thumbnails
-- across the dashboard and trailer lists — public avoids re-signing a URL
-- every time a card renders.
insert into storage.buckets (id, name, public) values ('trailer-photos', 'trailer-photos', true)
on conflict (id) do nothing;

create policy "public read trailer photos" on storage.objects for select using (bucket_id = 'trailer-photos');
create policy "auth upload trailer photos" on storage.objects for insert with check (bucket_id = 'trailer-photos' and auth.role() = 'authenticated');
create policy "auth update trailer photos" on storage.objects for update using (bucket_id = 'trailer-photos' and auth.role() = 'authenticated');
create policy "auth delete trailer photos" on storage.objects for delete using (bucket_id = 'trailer-photos' and auth.role() = 'authenticated');
