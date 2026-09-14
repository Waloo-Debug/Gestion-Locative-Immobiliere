"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOwnerCostsByProperty, upsertOwnerCosts } from "@/lib/ownerCosts";
import { fetchOwnerProfile } from "@/lib/owners";
import { fetchPropertyById, updatePropertyRent } from "@/lib/properties";
import {
  emptyOwnerCostForm,
  formToOwnerCosts,
  monthlyCostBreakdown,
  ownerCostsToForm,
  profitabilitySummary,
  rentSimulationRange,
  yearlyProjection,
} from "@/lib/profitability";
import { toErrorMessage } from "@/lib/errors";
import type { OwnerCostFormValues, Property } from "@/lib/types";

export function usePropertyCalculator(propertyId?: string) {
  const [property, setProperty] = useState<Property | null>(null);
  const [form, setForm] = useState<OwnerCostFormValues>(emptyOwnerCostForm);
  const [simulatedRent, setSimulatedRent] = useState(0);
  const [rentTouched, setRentTouched] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRent, setSavingRent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    async function load() {
      const [nextProperty, costsResult] = await Promise.all([
        fetchPropertyById(propertyId!),
        fetchOwnerCostsByProperty(propertyId!),
      ]);
      setProperty(nextProperty);
      setForm(ownerCostsToForm(costsResult.data));
      setSimulatedRent(Number(nextProperty?.base_rent_price || 0));
      setRentTouched(false);
      setMissingTable(costsResult.missingTable);
      setLoading(false);
    }
    load();
  }, [propertyId]);

  const costs = useMemo(
    () => (propertyId ? formToOwnerCosts(propertyId, form) : null),
    [form, propertyId],
  );
  const storedRent = Number(property?.base_rent_price || 0);
  const breakEven = costs ? profitabilitySummary(costs, storedRent).breakEven : 0;

  useEffect(() => {
    if (!rentTouched) setSimulatedRent(storedRent);
  }, [storedRent, rentTouched]);

  const summary = costs ? profitabilitySummary(costs, simulatedRent) : null;
  const projection = costs ? yearlyProjection(costs, simulatedRent) : [];
  const costSlices = costs ? monthlyCostBreakdown(costs) : [];
  const rentRange = rentSimulationRange(storedRent, breakEven);

  function setField<K extends keyof OwnerCostFormValues>(key: K, value: OwnerCostFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateSimulatedRent(value: number) {
    setRentTouched(true);
    setSimulatedRent(value);
  }

  function resetSimulatedRent() {
    setRentTouched(false);
    setSimulatedRent(storedRent);
  }

  async function saveSimulatedRent() {
    if (!propertyId || !property) return;
    setSavingRent(true);
    setMessage(null);
    const nextRent = Math.round(simulatedRent * 100) / 100;
    try {
      await updatePropertyRent(propertyId, nextRent, Number(property.service_charges || 0));
    } catch (err) {
      setMessage(toErrorMessage(err, "Impossible d'enregistrer le loyer."));
      return;
    } finally {
      setSavingRent(false);
    }
    setProperty({ ...property, base_rent_price: nextRent });
    setSimulatedRent(nextRent);
    setRentTouched(false);
    setMessage(`Loyer HC enregistré à ${nextRent.toFixed(0)} €.`);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId || !costs) return;
    setSaving(true);
    setMessage(null);
    const owner = await fetchOwnerProfile();
    const { error } = await upsertOwnerCosts({ ...costs, owner_id: owner?.id ?? null });
    setSaving(false);
    if (error) {
      console.error("Erreur upsert property_owner_costs:", error);
      const detail = error.message || "erreur inconnue";
      if (detail.toLowerCase().includes("row-level security") || error.code === "42501") {
        setMessage(
          "Enregistrement bloqué par RLS. Exécute dans Supabase les policies anon/authenticated du fichier supabase/property_owner_costs.sql.",
        );
      } else {
        setMessage(`Enregistrement impossible : ${detail}`);
      }
      return;
    }
    setMessage("Dépenses enregistrées.");
  }

  return {
    property,
    form,
    setField,
    summary,
    projection,
    costSlices,
    storedRent,
    simulatedRent,
    rentRange,
    updateSimulatedRent,
    resetSimulatedRent,
    saveSimulatedRent,
    rentTouched,
    missingTable,
    loading,
    saving,
    savingRent,
    message,
    save,
  };
}
