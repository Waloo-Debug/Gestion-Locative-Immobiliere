-- Profil unique du propriétaire / bailleur (infos baux & quittances).
-- À exécuter dans l'éditeur SQL de Supabase.

create table if not exists public.owner_profiles (
  id text primary key default 'default' check (id = 'default'),
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

insert into public.owner_profiles (id)
values ('default')
on conflict (id) do nothing;

alter table public.owner_profiles enable row level security;

drop policy if exists "owner_profiles_anon_all" on public.owner_profiles;
drop policy if exists "owner_profiles_authenticated_all" on public.owner_profiles;

create policy "owner_profiles_anon_all"
  on public.owner_profiles
  for all
  to anon
  using (true)
  with check (true);

create policy "owner_profiles_authenticated_all"
  on public.owner_profiles
  for all
  to authenticated
  using (true)
  with check (true);
