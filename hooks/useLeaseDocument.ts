"use client";

import { useEffect, useState } from "react";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";
import { insertBailDocument } from "@/lib/documents";
import { buildBailFileName } from "@/lib/format";
import { fetchOwnerProfile } from "@/lib/owners";
import { fetchPropertyById } from "@/lib/properties";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

export function useLeaseDocument(id?: string) {
  const { profile: contextProfile } = useOwnerProfile();
  const [bien, setBien] = useState<Property | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const tenant: Rental | null = bien?.rentals && bien.rentals.length > 0 ? bien.rentals[0] : null;

  useEffect(() => {
    if (!id) return;

    async function load() {
      const data = await fetchPropertyById(id!);
      if (data) setBien(data);
      setOwner(await fetchOwnerProfile());
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

  return { bien, owner: owner || contextProfile, tenant, loading, handlePrintAndSave };
}
