"use client";

import { useEffect, useState } from "react";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";
import { insertBailDocument } from "@/lib/documents";
import { toErrorMessage } from "@/lib/errors";
import { buildBailFileName } from "@/lib/format";
import { fetchOwnerProfile } from "@/lib/owners";
import { fetchPropertyById } from "@/lib/properties";
import { getActiveRental } from "@/lib/rentals";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

export function useLeaseDocument(id?: string) {
  const { profile: contextProfile } = useOwnerProfile();
  const [bien, setBien] = useState<Property | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Le bail se rédige pour le locataire actif, pas pour le premier de la liste.
  const tenant: Rental | null = bien ? getActiveRental(bien) : null;

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const [property, profile] = await Promise.all([fetchPropertyById(id!), fetchOwnerProfile()]);
        if (cancelled) return;
        setBien(property);
        setOwner(profile);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(toErrorMessage(err, "Impossible de charger le bail."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handlePrintAndSave() {
    if (!bien || !tenant) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await insertBailDocument(bien.id, tenant.id, buildBailFileName(bien, tenant));
    } catch (err) {
      // L'impression reste possible même si la traçabilité échoue.
      setSaveError(toErrorMessage(err, "Le bail n'a pas pu être tracé dans les documents."));
    } finally {
      setIsSaving(false);
    }

    window.print();
  }

  return {
    bien,
    owner: owner || contextProfile,
    tenant,
    loading,
    error,
    saveError,
    isSaving,
    handlePrintAndSave,
  };
}
