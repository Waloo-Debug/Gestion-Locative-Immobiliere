-- À exécuter dans l'éditeur SQL de Supabase.
-- Une ligne par bien : dépenses récurrentes du propriétaire.

create table if not exists public.property_owner_costs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties (id) on delete cascade,
  owner_id uuid references auth.users (id) on delete set null,
  purchase_price numeric(12, 2) not null default 0,
  monthly_loan numeric(12, 2) not null default 0,
  monthly_loan_insurance numeric(12, 2) not null default 0,
  monthly_pno_insurance numeric(12, 2) not null default 0,
  monthly_condo_charges numeric(12, 2) not null default 0,
  monthly_management_fees numeric(12, 2) not null default 0,
  monthly_other numeric(12, 2) not null default 0,
  annual_property_tax numeric(12, 2) not null default 0,
  annual_cfe numeric(12, 2) not null default 0,
  annual_works_provision numeric(12, 2) not null default 0,
  annual_other numeric(12, 2) not null default 0,
  vacancy_months_per_year numeric(4, 2) not null default 0,
  annual_rent_increase_percent numeric(5, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_owner_costs_property_id_idx
  on public.property_owner_costs (property_id);

alter table public.property_owner_costs enable row level security;

-- Aligné sur le reste de l'app (accès via clé anon, sans session auth obligatoire).
drop policy if exists "property_owner_costs_authenticated" on public.property_owner_costs;
drop policy if exists "property_owner_costs_anon_all" on public.property_owner_costs;
drop policy if exists "property_owner_costs_authenticated_all" on public.property_owner_costs;

create policy "property_owner_costs_anon_all"
  on public.property_owner_costs
  for all
  to anon
  using (true)
  with check (true);

create policy "property_owner_costs_authenticated_all"
  on public.property_owner_costs
  for all
  to authenticated
  using (true)
  with check (true);
