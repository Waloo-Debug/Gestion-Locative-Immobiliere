"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  acceptInviteByToken,
  getInviteByToken,
  type InvitePreview,
} from "@/lib/coowners";
import { createClient } from "@/lib/supabase/client";
import { ownershipTypeLabel } from "@/lib/accountType";
import { cn } from "@/lib/utils";

function InvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Lien d’invitation invalide.");
      setLoading(false);
      return;
    }
    Promise.all([
      getInviteByToken(token),
      createClient().auth.getUser(),
    ]).then(([inviteResult, auth]) => {
      if (inviteResult.error || !inviteResult.data) {
        setError(inviteResult.error?.message || "Invitation introuvable.");
      } else {
        setInvite(inviteResult.data);
      }
      setSignedInEmail(auth.data.user?.email ?? null);
      setLoading(false);
    });
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setAccepting(true);
    const { propertyId, error: acceptError } = await acceptInviteByToken(token);
    setAccepting(false);
    if (acceptError || !propertyId) {
      setError(acceptError?.message || "Impossible d’accepter l’invitation.");
      return;
    }
    router.replace(`/bien/${propertyId}`);
    router.refresh();
  }

  const signupHref = `/inscription?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite?.email || "")}`;
  const loginHref = `/connexion?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invite?.email || "")}&next=${encodeURIComponent(`/invitation?token=${token}`)}`;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/accueil" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Locagest</span>
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle>Invitation à un bien</CardTitle>
            <CardDescription>
              Tu as été invité(e) à co-gérer un bien sur Locagest, avec les mêmes droits que l’inviteur.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p className="text-sm text-muted-foreground">Chargement...</p>}
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {!loading && invite && (
              <>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <p className="font-medium">{invite.property_label || "Bien partagé"}</p>
                  <p className="text-muted-foreground">
                    {ownershipTypeLabel(invite.ownership_type as "personne_morale" | "entreprise" | null)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Destiné à {invite.email}</p>
                  {invite.status !== "pending" && (
                    <p className="mt-1 text-xs text-destructive">Statut : {invite.status}</p>
                  )}
                </div>

                {invite.status === "pending" && (
                  <>
                    {signedInEmail &&
                    signedInEmail.toLowerCase() === invite.email.toLowerCase() ? (
                      <Button className="w-full" disabled={accepting} onClick={handleAccept}>
                        {accepting ? "Acceptation..." : "Accepter l’invitation"}
                      </Button>
                    ) : signedInEmail ? (
                      <p className="text-sm text-muted-foreground">
                        Tu es connecté(e) avec {signedInEmail}. Déconnecte-toi ou utilise le compte{" "}
                        {invite.email}.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link href={signupHref} className={cn(buttonVariants({ className: "w-full" }))}>
                          Créer un compte
                        </Link>
                        <Link
                          href={loginHref}
                          className={cn(buttonVariants({ variant: "outline", className: "w-full" }))}
                        >
                          J’ai déjà un compte
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Chargement...</div>}>
      <InvitationContent />
    </Suspense>
  );
}
