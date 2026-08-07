-- Run this in Supabase: SQL Editor > New query > paste > Run

alter table renters add column if not exists license_document_url text;
alter table renters add column if not exists license_document_filename text;

alter table trailers add column if not exists registration_url text;
alter table trailers add column if not exists registration_filename text;
alter table trailers add column if not exists insurance_url text;
alter table trailers add column if not exists insurance_filename text;

-- Private bucket for these documents (like contracts) — separate from
-- 'contracts' so signed lease/rental contracts stay in their own bucket.
insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "auth read documents" on storage.objects for select using (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "auth upload documents" on storage.objects for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "auth update documents" on storage.objects for update using (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "auth delete documents" on storage.objects for delete using (bucket_id = 'documents' and auth.role() = 'authenticated');
