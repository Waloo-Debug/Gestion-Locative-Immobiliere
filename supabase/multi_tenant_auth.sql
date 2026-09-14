-- Locagest : multi-utilisateur (user_id + RLS)
-- 1) Exécuter ce script dans Supabase SQL Editor
-- 2) Créer ton compte (inscription)
-- 3) Copier ton UUID (Authentication → Users)
-- 4) Exécuter le bloc MIGRATION en bas avec ton UUID

-- Si une ancienne table owner_profiles (id text 'default') existe, la renommer :
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'owner_profiles'
      and column_name = 'id'
      and data_type = 'text'
  ) then
    alter table public.owner_profiles rename to owner_profiles_legacy;
  end if;
end $$;

-- ========== SCHÉMA ==========

alter table public.properties
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.documents
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.property_owner_costs
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- Profil bailleur : une ligne par utilisateur
create table if not exists public.owner_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  street_number text,
  street_name text,
  city text,
  postal_code text,
  address text,
  quittance_generation_day integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.owner_profiles add column if not exists street_number text;
alter table public.owner_profiles add column if not exists street_name text;
alter table public.owner_profiles add column if not exists city text;
alter table public.owner_profiles add column if not exists postal_code text;
alter table public.owner_profiles add column if not exists address text;
alter table public.owner_profiles add column if not exists quittance_generation_day integer;
alter table public.owner_profiles add column if not exists account_type text;
alter table public.owner_profiles add column if not exists siret text;

-- Si l'ancienne table singleton (id text 'default') existe, on garde les colonnes utiles
-- et on migrera manuellement vers l'UUID du compte (voir MIGRATION).

create index if not exists properties_user_id_idx on public.properties (user_id);
create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists property_owner_costs_user_id_idx on public.property_owner_costs (user_id);

-- ========== RLS ==========

alter table public.properties enable row level security;
alter table public.rentals enable row level security;
alter table public.documents enable row level security;
alter table public.property_owner_costs enable row level security;
alter table public.owner_profiles enable row level security;

-- Properties
drop policy if exists "properties_anon_all" on public.properties;
drop policy if exists "properties_authenticated_all" on public.properties;
drop policy if exists "properties_select_own" on public.properties;
drop policy if exists "properties_insert_own" on public.properties;
drop policy if exists "properties_update_own" on public.properties;
drop policy if exists "properties_delete_own" on public.properties;

create policy "properties_select_own"
  on public.properties for select to authenticated
  using (user_id = auth.uid());

create policy "properties_insert_own"
  on public.properties for insert to authenticated
  with check (user_id = auth.uid());

create policy "properties_update_own"
  on public.properties for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "properties_delete_own"
  on public.properties for delete to authenticated
  using (user_id = auth.uid());

-- Rentals (via propriété parente)
drop policy if exists "rentals_anon_all" on public.rentals;
drop policy if exists "rentals_authenticated_all" on public.rentals;
drop policy if exists "rentals_select_own" on public.rentals;
drop policy if exists "rentals_insert_own" on public.rentals;
drop policy if exists "rentals_update_own" on public.rentals;
drop policy if exists "rentals_delete_own" on public.rentals;

create policy "rentals_select_own"
  on public.rentals for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = rentals.property_id and p.user_id = auth.uid()
    )
  );

create policy "rentals_insert_own"
  on public.rentals for insert to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = rentals.property_id and p.user_id = auth.uid()
    )
  );

create policy "rentals_update_own"
  on public.rentals for update to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = rentals.property_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = rentals.property_id and p.user_id = auth.uid()
    )
  );

create policy "rentals_delete_own"
  on public.rentals for delete to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = rentals.property_id and p.user_id = auth.uid()
    )
  );

-- Documents
drop policy if exists "documents_anon_all" on public.documents;
drop policy if exists "documents_authenticated_all" on public.documents;
drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "documents_select_own"
  on public.documents for select to authenticated
  using (user_id = auth.uid());

create policy "documents_insert_own"
  on public.documents for insert to authenticated
  with check (user_id = auth.uid());

create policy "documents_update_own"
  on public.documents for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "documents_delete_own"
  on public.documents for delete to authenticated
  using (user_id = auth.uid());

-- property_owner_costs
drop policy if exists "property_owner_costs_anon_all" on public.property_owner_costs;
drop policy if exists "property_owner_costs_authenticated_all" on public.property_owner_costs;
drop policy if exists "property_owner_costs_select_own" on public.property_owner_costs;
drop policy if exists "property_owner_costs_insert_own" on public.property_owner_costs;
drop policy if exists "property_owner_costs_update_own" on public.property_owner_costs;
drop policy if exists "property_owner_costs_delete_own" on public.property_owner_costs;

create policy "property_owner_costs_select_own"
  on public.property_owner_costs for select to authenticated
  using (user_id = auth.uid());

create policy "property_owner_costs_insert_own"
  on public.property_owner_costs for insert to authenticated
  with check (user_id = auth.uid());

create policy "property_owner_costs_update_own"
  on public.property_owner_costs for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "property_owner_costs_delete_own"
  on public.property_owner_costs for delete to authenticated
  using (user_id = auth.uid());

-- owner_profiles
drop policy if exists "owner_profiles_anon_all" on public.owner_profiles;
drop policy if exists "owner_profiles_authenticated_all" on public.owner_profiles;
drop policy if exists "owner_profiles_select_own" on public.owner_profiles;
drop policy if exists "owner_profiles_insert_own" on public.owner_profiles;
drop policy if exists "owner_profiles_update_own" on public.owner_profiles;
drop policy if exists "owner_profiles_delete_own" on public.owner_profiles;

create policy "owner_profiles_select_own"
  on public.owner_profiles for select to authenticated
  using (id = auth.uid());

create policy "owner_profiles_insert_own"
  on public.owner_profiles for insert to authenticated
  with check (id = auth.uid());

create policy "owner_profiles_update_own"
  on public.owner_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "owner_profiles_delete_own"
  on public.owner_profiles for delete to authenticated
  using (id = auth.uid());

-- ========== MIGRATION (à exécuter APRÈS création de ton compte) ==========
-- Remplace YOUR_USER_UUID par ton id (Authentication → Users)

/*
update public.properties
set user_id = 'YOUR_USER_UUID'
where user_id is null;

update public.documents
set user_id = 'YOUR_USER_UUID'
where user_id is null;

update public.property_owner_costs
set user_id = coalesce(user_id, owner_id, 'YOUR_USER_UUID'::uuid)
where user_id is null;

-- Si tu avais une ligne singleton owner_profiles id='default' (ancienne table text) :
-- recopier manuellement les champs dans owner_profiles avec id = YOUR_USER_UUID
*/
