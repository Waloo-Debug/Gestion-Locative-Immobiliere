"use client";

import { useEffect, useState } from "react";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";
import { fetchOwnerProfilesForProperty } from "@/lib/coowners";
import { insertBailDocument } from "@/lib/documents";
import { buildBailFileName } from "@/lib/format";
import { fetchPropertyById } from "@/lib/properties";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

export function useLeaseDocument(id?: string) {
  const { profile: contextProfile } = useOwnerProfile();
  const [bien, setBien] = useState<Property | null>(null);
  const [owners, setOwners] = useState<OwnerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const tenant: Rental | null = bien?.rentals && bien.rentals.length > 0 ? bien.rentals[0] : null;

  useEffect(() => {
    if (!id) return;

    async function load() {
      const data = await fetchPropertyById(id!);
      if (data) {
        setBien(data);
        setOwners(await fetchOwnerProfilesForProperty(data.id));
      }
      setLoading(false);
    }

    load();
  }, [id]);

  async function handlePrintAndSave() {
    if (!bien || !tenant) return;

    try {
      const fileName = buildBailFileName(bien, tenant);
      const { error } = await insertBailDocument(bien.id, tenant.id, fileName);
      if (error) {
        console.error("Erreur lors de l'enregistrement dans la table documents :", error);
      }
    } catch (error) {
      console.error("Erreur d'exécution :", error);
    }

    window.print();
  }

  const resolvedOwners = owners.length ? owners : contextProfile ? [contextProfile] : [];

  return { bien, owners: resolvedOwners, owner: resolvedOwners[0] || null, tenant, loading, handlePrintAndSave };
}
