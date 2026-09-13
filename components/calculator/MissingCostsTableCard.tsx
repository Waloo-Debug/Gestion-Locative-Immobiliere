import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SQL = `create table if not exists public.property_owner_costs (
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

alter table public.property_owner_costs enable row level security;

create policy "property_owner_costs_anon_all"
  on public.property_owner_costs for all to anon
  using (true) with check (true);

create policy "property_owner_costs_authenticated_all"
  on public.property_owner_costs for all to authenticated
  using (true) with check (true);`;

export function MissingCostsTableCard() {
  return (
    <Card className="border-amber-500/30">
      <CardHeader>
        <CardTitle>Table Supabase à créer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Le calculateur enregistre les dépenses dans <code className="text-foreground">property_owner_costs</code>.
          Exécute ce SQL une fois dans l&apos;éditeur SQL de ton projet Supabase :
        </p>
        <pre className="max-h-72 overflow-auto rounded-lg bg-muted/50 p-3 text-xs text-foreground">{SQL}</pre>
        <p>Le fichier du dépôt se trouve aussi dans <code className="text-foreground">supabase/property_owner_costs.sql</code>.</p>
      </CardContent>
    </Card>
  );
}
