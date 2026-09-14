"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPropertyInvite,
  inviteLink,
  listCoowners,
  listPropertyInvites,
  removeCoowner,
  revokePropertyInvite,
} from "@/lib/coowners";
import { ownerDisplayName } from "@/lib/owners";
import { createClient } from "@/lib/supabase/client";
import type { PropertyCoowner, PropertyInvite } from "@/lib/types";

async function sendInviteEmail(inviteId: string) {
  const response = await fetch("/api/invites/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteId }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Impossible d’envoyer l’e-mail.");
  }
}

export function CoownersPanel({ propertyId }: { propertyId: string }) {
  const [coowners, setCoowners] = useState<PropertyCoowner[]>([]);
  const [invites, setInvites] = useState<PropertyInvite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [me, setMe] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [owners, pending] = await Promise.all([
      listCoowners(propertyId),
      listPropertyInvites(propertyId),
    ]);
    setCoowners(owners);
    setInvites(pending);
  }, [propertyId]);

  useEffect(() => {
    reload();
    createClient()
      .auth.getUser()
      .then(({ data }) => setMe(data.user?.id ?? null));
  }, [reload]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setLastLink(null);

    const { data, error } = await createPropertyInvite(propertyId, email);
    if (error || !data) {
      setLoading(false);
      setMessage(error?.message || "Invitation impossible.");
      return;
    }

    const link = inviteLink(data.token);
    setLastLink(link);

    try {
      await sendInviteEmail(data.id);
      setMessage(`Invitation envoyée par e-mail à ${data.email}.`);
    } catch (sendError) {
      const reason = sendError instanceof Error ? sendError.message : "Envoi impossible.";
      setMessage(
        `Invitation créée, mais l’e-mail n’a pas pu être envoyé (${reason}). Tu peux copier le lien ci-dessous.`,
      );
    }

    setEmail("");
    setLoading(false);
    await reload();
  }

  async function handleResend(invite: PropertyInvite) {
    setResendingId(invite.id);
    setMessage(null);
    try {
      await sendInviteEmail(invite.id);
      setMessage(`E-mail renvoyé à ${invite.email}.`);
    } catch (sendError) {
      setMessage(sendError instanceof Error ? sendError.message : "Renvoi impossible.");
    } finally {
      setResendingId(null);
    }
  }

  async function handleRevokeInvite(id: string) {
    await revokePropertyInvite(id);
    await reload();
  }

  async function handleRemove(userId: string) {
    if (!window.confirm("Retirer ce co-détenteur du bien ?")) return;
    const { error } = await removeCoowner(propertyId, userId);
    if (error) {
      alert(error.message);
      return;
    }
    await reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Co-détenteurs</CardTitle>
        <CardDescription>
          Invite une personne sur ce bien uniquement. Elle recevra un e-mail avec un lien pour rejoindre la
          co-gestion (mêmes droits de lecture et d’édition).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          {coowners.map((owner) => (
            <li
              key={owner.user_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <div>
                <p className="font-medium">{ownerDisplayName(owner.profile)}</p>
                <p className="text-xs text-muted-foreground">{owner.profile?.email || owner.user_id}</p>
              </div>
              {me && owner.user_id !== me && (
                <Button type="button" variant="outline" size="sm" onClick={() => handleRemove(owner.user_id)}>
                  Retirer
                </Button>
              )}
              {me && owner.user_id === me && (
                <span className="text-xs text-muted-foreground">Toi</span>
              )}
            </li>
          ))}
        </ul>

        {invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Invitations en attente
            </p>
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
              >
                <span>{invite.email}</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resendingId === invite.id}
                    onClick={() => handleResend(invite)}
                  >
                    {resendingId === invite.id ? "Envoi..." : "Renvoyer l’e-mail"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = inviteLink(invite.token);
                      void navigator.clipboard?.writeText(link);
                      setLastLink(link);
                      setMessage("Lien recopié.");
                    }}
                  >
                    Copier le lien
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRevokeInvite(invite.id)}>
                    Révoquer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleInvite} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite-email">Inviter par e-mail</Label>
            <Input
              id="invite-email"
              type="email"
              required
              placeholder="exemple@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "..." : "Inviter"}
          </Button>
        </form>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {lastLink && (
          <p className="break-all rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">{lastLink}</p>
        )}
      </CardContent>
    </Card>
  );
}
