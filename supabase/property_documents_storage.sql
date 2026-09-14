-- Documents fichiers liés aux biens (diagnostics, états des lieux)
-- À exécuter dans Supabase → SQL Editor

-- Métadonnées fichiers sur documents
alter table public.documents
  add column if not exists storage_path text;

alter table public.documents
  add column if not exists mime_type text;

alter table public.documents
  add column if not exists file_size bigint;

comment on column public.documents.storage_path is
  'Chemin dans le bucket property-files (null pour Bail/Quittance générés).';

-- Bucket privé
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-files',
  'property-files',
  false,
  20971520, -- 20 Mo
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies Storage : 1er segment du chemin = property_id
drop policy if exists "property_files_select" on storage.objects;
drop policy if exists "property_files_insert" on storage.objects;
drop policy if exists "property_files_update" on storage.objects;
drop policy if exists "property_files_delete" on storage.objects;

create policy "property_files_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'property-files'
    and public.can_access_property((string_to_array(name, '/'))[1]::uuid)
  );

create policy "property_files_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-files'
    and public.can_access_property((string_to_array(name, '/'))[1]::uuid)
  );

create policy "property_files_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'property-files'
    and public.can_access_property((string_to_array(name, '/'))[1]::uuid)
  )
  with check (
    bucket_id = 'property-files'
    and public.can_access_property((string_to_array(name, '/'))[1]::uuid)
  );

create policy "property_files_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'property-files'
    and public.can_access_property((string_to_array(name, '/'))[1]::uuid)
  );
