"use client";

import { BackButton } from "@/components/ui/BackButton";
import { OwnerProfileForm } from "@/components/profile/OwnerProfileForm";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";

export default function ProfilPage() {
  const profile = useOwnerProfile();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <BackButton href="/" label="Retour au tableau de bord" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil propriétaire</h1>
        <p className="text-sm text-muted-foreground">
          Renseigne les infos du bailleur utilisées dans les baux et les quittances.
        </p>
      </div>
      {profile.loading ? (
        <p className="text-sm text-muted-foreground">Chargement du profil...</p>
      ) : (
        <OwnerProfileForm />
      )}
    </main>
  );
}
