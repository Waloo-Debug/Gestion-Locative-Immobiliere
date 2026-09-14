"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";

export function OwnerProfileForm() {
  const profile = useOwnerProfile();

  return (
    <form onSubmit={profile.save} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identité du bailleur</CardTitle>
          <CardDescription>
            Ces informations apparaissent sur les baux et les quittances. Le type personne morale / entreprise se
            choisit sur chaque bien.
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
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-first-name">Prénom</Label>
            <Input
              id="owner-first-name"
              value={profile.form.firstName}
              onChange={(event) => profile.setField("firstName", event.target.value)}
              autoComplete="given-name"
              required
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
              required
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
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-street-number">N° de rue</Label>
            <Input
              id="owner-street-number"
              value={profile.form.streetNumber}
              onChange={(event) => profile.setField("streetNumber", event.target.value)}
              autoComplete="address-line1"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-street-name">Nom de rue</Label>
            <Input
              id="owner-street-name"
              value={profile.form.streetName}
              onChange={(event) => profile.setField("streetName", event.target.value)}
              autoComplete="address-line2"
              required
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
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-city">Ville</Label>
            <Input
              id="owner-city"
              value={profile.form.city}
              onChange={(event) => profile.setField("city", event.target.value)}
              autoComplete="address-level2"
              required
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
