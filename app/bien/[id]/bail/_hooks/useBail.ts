'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildBailFileName, saveBailDocument } from '../_api/command';
import { getBailReadModel, getPropertyOwners } from '../_api/query';
import type { BailReadModel, OwnerProfile } from '../_api/types';

interface UseBailResult {
  bail: BailReadModel | null;
  owners: OwnerProfile[];
  loading: boolean;
  error: string | null;
  saveError: string | null;
  isSaving: boolean;
  savedFileName: string | null;
  printBail: () => void;
  downloadBail: () => void;
}

function downloadLeaseHtml(fileName: string) {
  const node = document.getElementById('lease-document');
  if (!node) return;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${fileName.replace(/\.pdf$/i, '')}</title>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; color: #1e293b; margin: 24px; line-height: 1.5; }
    h1, h2 { margin: 0 0 8px; }
  </style>
</head>
<body>
${node.outerHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName.replace(/\.pdf$/i, '.html');
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useBail(propertyId: string): UseBailResult {
  const [bail, setBail] = useState<BailReadModel | null>(null);
  const [owners, setOwners] = useState<OwnerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFileName, setSavedFileName] = useState<string | null>(null);
  const autoSavedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [readModel, ownerProfiles] = await Promise.all([
          getBailReadModel(propertyId),
          getPropertyOwners(propertyId),
        ]);

        if (cancelled) return;
        setBail(readModel);
        setOwners(ownerProfiles);
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

  useEffect(() => {
    if (!bail?.tenant || !bail.property) return;

    const key = `${bail.property.id}:${bail.tenant.id}`;
    if (autoSavedFor.current === key) return;
    autoSavedFor.current = key;

    let cancelled = false;

    async function persist() {
      setIsSaving(true);
      setSaveError(null);
      try {
        const fileName = await saveBailDocument({
          property: bail!.property,
          tenant: bail!.tenant!,
        });
        if (!cancelled) setSavedFileName(fileName);
      } catch (err) {
        if (!cancelled) {
          setSaveError(err instanceof Error ? err.message : "L'enregistrement du bail a échoué.");
          autoSavedFor.current = null;
        }
      } finally {
        if (!cancelled) setIsSaving(false);
      }
    }

    void persist();

    return () => {
      cancelled = true;
    };
  }, [bail]);

  const printBail = useCallback(() => {
    window.print();
  }, []);

  const downloadBail = useCallback(() => {
    if (!bail?.tenant) return;
    const fileName = savedFileName || buildBailFileName({ property: bail.property, tenant: bail.tenant });
    downloadLeaseHtml(fileName);
  }, [bail, savedFileName]);

  return {
    bail,
    owners,
    loading,
    error,
    saveError,
    isSaving,
    savedFileName,
    printBail,
    downloadBail,
  };
}
