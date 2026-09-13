-- À exécuter si la table existe déjà mais l'enregistrement échoue (RLS).
-- Autorise l'accès avec la clé anon, comme le reste de Locagest.

alter table public.property_owner_costs enable row level security;

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
