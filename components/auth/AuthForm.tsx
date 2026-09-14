"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  authMetadataFromForm,
  emptyOwnerProfileForm,
  ensureOwnerProfileFromAuth,
  upsertOwnerProfile,
} from "@/lib/owners";
import { acceptInviteByToken } from "@/lib/coowners";
import { createClient } from "@/lib/supabase/client";
import type { OwnerProfileFormValues } from "@/lib/types";
import { cn } from "@/lib/utils";

function translateAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirme d’abord ton e-mail via le lien reçu, puis reconnecte-toi.";
  }
  if (lower.includes("user already registered")) {
    return "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.";
  }
  if (lower.includes("signup is disabled")) {
    return "Les inscriptions sont désactivées dans Supabase (Authentication → Providers → Email).";
  }
  if (lower.includes("redirect")) {
    return "URL de redirection non autorisée. Ajoute http://localhost:3000/auth/callback dans Supabase → Authentication → URL Configuration.";
  }
  return message;
}

async function persistProfile(form: OwnerProfileFormValues) {
  const result = await upsertOwnerProfile(form);
  if (result.error && !result.missingTable) {
    throw new Error(result.error.message || "Impossible d’enregistrer le profil bailleur.");
  }
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const inviteToken = searchParams.get("invite");
  const prefillEmail = searchParams.get("email") || "";
  const authError = searchParams.get("error");
  const authDetails = searchParams.get("details");

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<OwnerProfileFormValues>({
    ...emptyOwnerProfileForm,
    email: prefillEmail,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "info">("info");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (prefillEmail) {
      setEmail(prefillEmail);
      setProfile((current) => ({ ...current, email: prefillEmail }));
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      setMessageTone("error");
      setMessage("Configuration manquante : NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (authError) {
      setMessageTone("error");
      const detail = authDetails ? ` (${decodeURIComponent(authDetails)})` : "";
      setMessage(`Connexion impossible${detail}. Réessaie ou crée un compte par e-mail.`);
    }
  }, [authError, authDetails, prefillEmail]);

  function setProfileField<K extends keyof OwnerProfileFormValues>(key: K, value: OwnerProfileFormValues[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function afterAuthSuccess(fallbackNext: string) {
    await ensureOwnerProfileFromAuth();
    if (inviteToken) {
      const { propertyId, error } = await acceptInviteByToken(inviteToken);
      if (!error && propertyId) {
        router.replace(`/bien/${propertyId}`);
        router.refresh();
        return;
      }
    }
    router.replace(fallbackNext);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          setMessageTone("error");
          setMessage(translateAuthError(error.message));
          setLoading(false);
          return;
        }
        if (!data.session) {
          setMessageTone("error");
          setMessage("Aucune session créée. Vérifie la confirmation e-mail dans Supabase.");
          setLoading(false);
          return;
        }
        await afterAuthSuccess(next);
        return;
      }

      const profileForm: OwnerProfileFormValues = {
        ...profile,
        email: email.trim().toLowerCase(),
      };

      const { data, error } = await supabase.auth.signUp({
        email: profileForm.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            inviteToken ? `/invitation?token=${inviteToken}` : "/dashboard",
          )}`,
          data: authMetadataFromForm(profileForm),
        },
      });

      if (error) {
        setMessageTone("error");
        setMessage(translateAuthError(error.message));
        setLoading(false);
        return;
      }

      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        setMessageTone("error");
        setMessage("Un compte existe déjà avec cet e-mail. Connecte-toi plutôt.");
        setLoading(false);
        return;
      }

      if (data.session) {
        await persistProfile(profileForm);
        await afterAuthSuccess("/dashboard");
        return;
      }

      setMessageTone("info");
      setMessage(
        inviteToken
          ? "Compte créé. Confirme ton e-mail via le lien reçu : tu seras ensuite rattaché au bien partagé."
          : "Compte créé. Un e-mail de confirmation t’a été envoyé. Ouvre le lien, puis reconnecte-toi.",
      );
      setLoading(false);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Erreur inattendue pendant l’authentification.");
      setLoading(false);
    }
  }

  const isLogin = mode === "login";
  const emailLocked = Boolean(prefillEmail && inviteToken);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]" />
      <header className="relative z-10 flex items-center justify-between px-4 py-4 md:px-8">
        <Link href="/accueil" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Locagest</span>
        </Link>
        <Link
          href={
            isLogin
              ? `/inscription${inviteToken ? `?invite=${inviteToken}&email=${encodeURIComponent(prefillEmail)}` : ""}`
              : `/connexion${inviteToken ? `?invite=${inviteToken}&email=${encodeURIComponent(prefillEmail)}` : ""}`
          }
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {isLogin ? "Créer un compte" : "Déjà un compte ?"}
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-4">
        <Card className={cn("w-full border-primary/20 shadow-lg", isLogin ? "max-w-md" : "max-w-xl")}>
          <CardHeader>
            <CardTitle>{isLogin ? "Connexion" : "Créer un compte"}</CardTitle>
            <CardDescription>
              {inviteToken
                ? "Accepte l’invitation après authentification pour accéder au bien partagé."
                : isLogin
                  ? "Accède à ton tableau de bord Locagest."
                  : "Renseigne ton identité de bailleur : elle servira pour les baux et quittances."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      autoComplete="family-name"
                      required
                      value={profile.lastName}
                      onChange={(event) => setProfileField("lastName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      autoComplete="given-name"
                      required
                      value={profile.firstName}
                      onChange={(event) => setProfileField("firstName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="phone">N° téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      value={profile.phone}
                      onChange={(event) => setProfileField("phone", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="streetNumber">N° de rue</Label>
                    <Input
                      id="streetNumber"
                      autoComplete="address-line1"
                      required
                      value={profile.streetNumber}
                      onChange={(event) => setProfileField("streetNumber", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="streetName">Nom de rue</Label>
                    <Input
                      id="streetName"
                      autoComplete="address-line2"
                      required
                      value={profile.streetName}
                      onChange={(event) => setProfileField("streetName", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      autoComplete="postal-code"
                      inputMode="numeric"
                      required
                      value={profile.postalCode}
                      onChange={(event) => setProfileField("postalCode", event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      autoComplete="address-level2"
                      required
                      value={profile.city}
                      onChange={(event) => setProfileField("city", event.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly={emailLocked}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {message && (
                <p
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    messageTone === "error"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-primary/20 bg-primary/10 text-foreground",
                  )}
                >
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Patiente..." : isLogin ? "Se connecter" : "S'inscrire"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
