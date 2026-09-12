'use client';

import { useCallback, useEffect, useState } from 'react';
import { saveBailDocument } from '../_api/command';
import { getBailReadModel, getCurrentOwner } from '../_api/query';
import type { BailReadModel, OwnerProfile } from '../_api/types';

interface UseBailResult {
  bail: BailReadModel | null;
  owner: OwnerProfile | null;
  loading: boolean;
  /** Erreur de chargement du bien ou du profil bailleur. */
  error: string | null;
  /** Erreur d'enregistrement du bail : l'impression a tout de même eu lieu. */
  saveError: string | null;
  isSaving: boolean;
  printAndSave: () => Promise<void>;
}

/**
 * Orchestration de la page de bail : chargement des données (query),
 * enregistrement du document (command) et états d'UI associés.
 */
export function useBail(propertyId: string): UseBailResult {
  const [bail, setBail] = useState<BailReadModel | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!propertyId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [readModel, ownerProfile] = await Promise.all([
          getBailReadModel(propertyId),
          getCurrentOwner(),
        ]);

        if (cancelled) return;
        setBail(readModel);
        setOwner(ownerProfile);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const printAndSave = useCallback(async () => {
    if (!bail?.tenant) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await saveBailDocument({ property: bail.property, tenant: bail.tenant });
    } catch (err) {
      // L'impression reste possible même si la traçabilité échoue.
      setSaveError(err instanceof Error ? err.message : "L'enregistrement du bail a échoué.");
    } finally {
      setIsSaving(false);
    }

    window.print();
  }, [bail]);

  return { bail, owner, loading, error, saveError, isSaving, printAndSave };
}
