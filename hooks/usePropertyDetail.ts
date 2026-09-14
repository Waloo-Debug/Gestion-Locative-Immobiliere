"use client";

import { useEffect, useState } from "react";
import { fetchDocumentsByProperty } from "@/lib/documents";
import { applyIrlIncrease } from "@/lib/format";
import { fetchIrl } from "@/lib/irl";
import { fetchPropertyById, updatePropertyRent, updatePropertyStatus } from "@/lib/properties";
import { archiveRentalsForProperty, createRental, getActiveRental, reactivateLatestRentalForProperty, updateRental } from "@/lib/rentals";
import { toErrorMessage } from "@/lib/errors";
import type { DocumentRecord, IrlData, Property, Rental, TenantFormValues } from "@/lib/types";

const emptyTenantForm: TenantFormValues = {
  t1FirstName: "",
  t1LastName: "",
  t2FirstName: "",
  t2LastName: "",
  tEmail: "",
  tPhone: "",
  tStreetNumber: "",
  tStreetName: "",
  tCity: "",
  tPostalCode: "",
  tEntryDate: "",
};

export function usePropertyDetail(id?: string) {
  const [bien, setBien] = useState<Property | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState<TenantFormValues>(emptyTenantForm);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [editRent, setEditRent] = useState("");
  const [editCharges, setEditCharges] = useState("");
  const [irlData, setIrlData] = useState<IrlData | null>(null);
  const [isLoadingIrl, setIsLoadingIrl] = useState(false);

  const tenant: Rental | null = bien ? getActiveRental(bien) : null;
  const bails = documents.filter((d) => d.document_type === "Bail");
  const quittances = documents.filter((d) => d.document_type === "Quittance");

  async function loadDetails() {
    if (!id) return;
    try {
      const [propertyData, docsData] = await Promise.all([
        fetchPropertyById(id),
        fetchDocumentsByProperty(id),
      ]);
      setBien(propertyData);
      setDocuments(docsData);
      setError(null);
    } catch (err) {
      // Sans cela, un échec de lecture s'afficherait comme « bien introuvable ».
      setError(toErrorMessage(err, "Impossible de charger le bien."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadDetails();
  }, [id]);

  function setTenantField<K extends keyof TenantFormValues>(key: K, value: TenantFormValues[K]) {
    setTenantForm((current) => ({ ...current, [key]: value }));
  }

  async function handleStatusChange(newStatus: string) {
    if (!id || !bien || newStatus === bien.status) return;
    setActionError(null);

    try {
      await updatePropertyStatus(id, newStatus);

      if (newStatus === "Vacant" || newStatus === "Vendu") {
        await archiveRentalsForProperty(id);
      }

      if (newStatus === "Loué" && !tenant) {
        const reactivatedId = await reactivateLatestRentalForProperty(id);
        await loadDetails();
        if (!reactivatedId) openTenantModal();
        return;
      }
    } catch (err) {
      setActionError(toErrorMessage(err, "Le changement de statut a échoué."));
    }

    await loadDetails();
  }

  function openTenantModal() {
    if (tenant) {
      setTenantForm({
        t1FirstName: tenant.tenant_first_name || "",
        t1LastName: tenant.tenant_last_name || "",
        t2FirstName: tenant.tenant2_first_name || "",
        t2LastName: tenant.tenant2_last_name || "",
        tEmail: tenant.tenant_email || "",
        tPhone: tenant.tenant_phone || "",
        tStreetNumber: tenant.tenant_street_number || "",
        tStreetName: tenant.tenant_street_name || "",
        tCity: tenant.tenant_city || "",
        tPostalCode: tenant.tenant_postal_code || "",
        tEntryDate: tenant.entry_date ? tenant.entry_date.split("T")[0] : "",
      });
    } else {
      setTenantForm(emptyTenantForm);
    }
    setIsTenantModalOpen(true);
  }

  async function loadIrl() {
    setIsLoadingIrl(true);
    try {
      setIrlData(await fetchIrl());
    } catch (error) {
      console.error("Impossible de charger l'IRL", error);
      setIrlData(null);
    } finally {
      setIsLoadingIrl(false);
    }
  }

  function openRentModal() {
    if (!bien) return;
    setEditRent(bien.base_rent_price?.toString() || "0");
    setEditCharges(bien.service_charges?.toString() || "0");
    setIsRentModalOpen(true);
    loadIrl();
  }

  function applyIrlToRent() {
    if (!irlData) return;
    const currentRent = parseFloat(editRent) || 0;
    setEditRent(applyIrlIncrease(currentRent, irlData.rate));
  }

  async function handleSaveRent(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setActionError(null);

    try {
      await updatePropertyRent(id, parseFloat(editRent) || 0, parseFloat(editCharges) || 0);
      setIsRentModalOpen(false);
    } catch (err) {
      // La modale reste ouverte : la saisie n'est pas perdue.
      setActionError(toErrorMessage(err, "L'enregistrement du loyer a échoué."));
      return;
    }

    await loadDetails();
  }

  async function handleSaveTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setActionError(null);

    try {
      if (tenant) {
        await updateRental(tenant.id, id, tenantForm);
      } else {
        await createRental(id, tenantForm);
        await updatePropertyStatus(id, "Loué");
      }
    } catch (err) {
      setActionError(toErrorMessage(err, "L'enregistrement du locataire a échoué."));
      return;
    }

    setIsTenantModalOpen(false);
    await loadDetails();
  }

  return {
    bien,
    loading,
    error,
    actionError,
    tenant,
    bails,
    quittances,
    isTenantModalOpen,
    setIsTenantModalOpen,
    tenantForm,
    setTenantField,
    isRentModalOpen,
    setIsRentModalOpen,
    editRent,
    setEditRent,
    editCharges,
    setEditCharges,
    irlData,
    isLoadingIrl,
    handleStatusChange,
    openTenantModal,
    openRentModal,
    applyIrlToRent,
    handleSaveRent,
    handleSaveTenant,
  };
}
