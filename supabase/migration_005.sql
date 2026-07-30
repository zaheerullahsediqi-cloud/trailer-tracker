-- Logo support
alter table company_settings add column if not exists logo_url text;

insert into storage.buckets (id, name, public) values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "public read branding" on storage.objects for select using (bucket_id = 'branding');
create policy "auth upload branding" on storage.objects for insert with check (bucket_id = 'branding' and auth.role() = 'authenticated');
create policy "auth update branding" on storage.objects for update using (bucket_id = 'branding' and auth.role() = 'authenticated');
create policy "auth delete branding" on storage.objects for delete using (bucket_id = 'branding' and auth.role() = 'authenticated');
