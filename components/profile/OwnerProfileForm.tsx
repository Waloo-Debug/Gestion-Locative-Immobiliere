"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";

const SQL = `create table if not exists public.owner_profiles (
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

insert into public.owner_profiles (id) values ('default') on conflict (id) do nothing;

alter table public.owner_profiles enable row level security;

create policy "owner_profiles_anon_all"
  on public.owner_profiles for all to anon
  using (true) with check (true);

create policy "owner_profiles_authenticated_all"
  on public.owner_profiles for all to authenticated
  using (true) with check (true);`;

export function OwnerProfileForm() {
  const profile = useOwnerProfile();

  return (
    <form onSubmit={profile.save} className="space-y-4">
      {profile.missingTable && (
        <Card>
          <CardHeader>
            <CardTitle>Table Supabase manquante</CardTitle>
            <CardDescription>
              Le profil est quand même sauvegardé sur cet appareil. Pour le partager et le garder en base, exécute ce
              SQL dans Supabase (<code className="text-foreground">supabase/owner_profiles.sql</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs whitespace-pre-wrap">{SQL}</pre>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identité du bailleur</CardTitle>
          <CardDescription>
            Ces informations apparaissent sur les baux et les quittances (côté propriétaire).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="owner-last-name">Nom</Label>
            <Input
              id="owner-last-name"
              value={profile.form.lastName}
              onChange={(event) => profile.setField("lastName", event.target.value)}
              autoComplete="family-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-first-name">Prénom</Label>
            <Input
              id="owner-first-name"
              value={profile.form.firstName}
              onChange={(event) => profile.setField("firstName", event.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="owner-email">E-mail</Label>
            <Input
              id="owner-email"
              type="email"
              value={profile.form.email}
              onChange={(event) => profile.setField("email", event.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="owner-phone">N° téléphone</Label>
            <Input
              id="owner-phone"
              type="tel"
              value={profile.form.phone}
              onChange={(event) => profile.setField("phone", event.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-street-number">N° de rue</Label>
            <Input
              id="owner-street-number"
              value={profile.form.streetNumber}
              onChange={(event) => profile.setField("streetNumber", event.target.value)}
              autoComplete="address-line1"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-street-name">Nom de rue</Label>
            <Input
              id="owner-street-name"
              value={profile.form.streetName}
              onChange={(event) => profile.setField("streetName", event.target.value)}
              autoComplete="address-line2"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-postal-code">Code postal</Label>
            <Input
              id="owner-postal-code"
              value={profile.form.postalCode}
              onChange={(event) => profile.setField("postalCode", event.target.value)}
              autoComplete="postal-code"
              inputMode="numeric"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-city">Ville</Label>
            <Input
              id="owner-city"
              value={profile.form.city}
              onChange={(event) => profile.setField("city", event.target.value)}
              autoComplete="address-level2"
            />
          </div>
        </CardContent>
      </Card>

      {profile.message && <p className="text-sm text-muted-foreground">{profile.message}</p>}

      <Button type="submit" disabled={profile.saving || profile.loading}>
        {profile.saving ? "Enregistrement..." : "Enregistrer le profil"}
      </Button>
    </form>
  );
}
