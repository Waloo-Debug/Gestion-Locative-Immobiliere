"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { OwnerProfileForm } from "@/components/profile/OwnerProfileForm";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";

function ProfilContent() {
  const profile = useOwnerProfile();
  const searchParams = useSearchParams();
  const completer = searchParams.get("completer") === "1";

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <BackButton href="/dashboard" label="Retour au tableau de bord" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil propriétaire</h1>
        <p className="text-sm text-muted-foreground">
          {completer
            ? "Complète tes infos bailleur pour les baux et quittances (nom, téléphone, adresse)."
            : "Renseigne les infos du bailleur utilisées dans les baux et les quittances."}
        </p>
      </div>
      {completer && (
        <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm">
          Ces champs sont obligatoires pour générer correctement un bail côté propriétaire.
        </p>
      )}
      {profile.loading ? (
        <p className="text-sm text-muted-foreground">Chargement du profil...</p>
      ) : (
        <OwnerProfileForm />
      )}
    </main>
  );
}

export default function ProfilPage() {
  return (
    <Suspense fallback={<main className="p-6 text-sm text-muted-foreground">Chargement...</main>}>
      <ProfilContent />
    </Suspense>
  );
}
