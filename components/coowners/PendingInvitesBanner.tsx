"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  acceptInviteByToken,
  listMyPendingInvites,
} from "@/lib/coowners";
import type { PropertyInvite } from "@/lib/types";

export function PendingInvitesBanner() {
  const router = useRouter();
  const [invites, setInvites] = useState<PropertyInvite[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    listMyPendingInvites().then(setInvites);
  }, []);

  if (!invites.length) return null;

  async function accept(invite: PropertyInvite) {
    setBusyId(invite.id);
    const { propertyId, error } = await acceptInviteByToken(invite.token);
    setBusyId(null);
    if (error || !propertyId) {
      alert(error?.message || "Impossible d’accepter l’invitation.");
      return;
    }
    setInvites((current) => current.filter((item) => item.id !== invite.id));
    router.push(`/bien/${propertyId}`);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm">
      <p className="font-medium">
        Tu as {invites.length} invitation{invites.length > 1 ? "s" : ""} en attente
      </p>
      <ul className="mt-2 space-y-2">
        {invites.map((invite) => (
          <li key={invite.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Bien partagé · {invite.email}</span>
            <div className="flex gap-2">
              <Link href={`/invitation?token=${invite.token}`} className="text-xs underline">
                Voir
              </Link>
              <Button
                type="button"
                size="sm"
                disabled={busyId === invite.id}
                onClick={() => accept(invite)}
              >
                {busyId === invite.id ? "..." : "Accepter"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
