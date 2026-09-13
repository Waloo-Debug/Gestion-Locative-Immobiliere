"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDocuments } from "@/lib/documents";
import { fetchOwnerProfile } from "@/lib/owners";
import { fetchProperties } from "@/lib/properties";
import {
  currentPeriod,
  generateReceiptsForPeriod,
  loadGenerationDay,
  persistGenerationDay,
  recentPeriods,
  uniqueQuittances,
} from "@/lib/receipts";
import { getActiveTenants } from "@/lib/rentals";
import type { DocumentRecord, Property } from "@/lib/types";

export function useReceiptsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [generationDay, setGenerationDay] = useState(5);
  const [period, setPeriod] = useState(currentPeriod);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [nextProperties, nextDocuments, nextOwner] = await Promise.all([
      fetchProperties(),
      fetchDocuments(),
      fetchOwnerProfile(),
    ]);
    setProperties(nextProperties);
    setDocuments(nextDocuments);
    setGenerationDay(await loadGenerationDay(nextOwner));
  }, []);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  const receipts = useMemo(
    () => uniqueQuittances(documents),
    [documents],
  );
  const activeTenants = useMemo(() => getActiveTenants(properties), [properties]);
  const periods = useMemo(() => recentPeriods(), []);

  async function saveDay(day: number) {
    setSaving(true);
    setGenerationDay(await persistGenerationDay(day));
    setSaving(false);
    setMessage(`Les quittances seront générées chaque mois à partir du ${day}.`);
  }

  async function generate(selectedPeriod = period) {
    setGenerating(true);
    setMessage(null);
    const result = await generateReceiptsForPeriod(selectedPeriod);
    await reload();
    setGenerating(false);
    if (result.eligible === 0) {
      setMessage("Aucun locataire actif pour cette période.");
      return;
    }
    setMessage(
      `${result.created} quittance${result.created > 1 ? "s" : ""} générée${result.created > 1 ? "s" : ""}${
        result.skipped ? `, ${result.skipped} déjà existante${result.skipped > 1 ? "s" : ""}` : ""
      }.`,
    );
  }

  return {
    properties,
    receipts,
    activeTenants,
    periods,
    generationDay,
    period,
    setPeriod,
    loading,
    saving,
    generating,
    message,
    saveDay,
    generate,
  };
}
