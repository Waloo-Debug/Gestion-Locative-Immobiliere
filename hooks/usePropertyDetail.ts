"use client";

import { useEffect, useState } from "react";
import { fetchIrl } from "@/lib/irl";
import { fetchPropertyById, updatePropertyRent, updatePropertyStatus } from "@/lib/properties";
import {
  archiveRentalsForProperty,
  createRental,
  getActiveRental,
  reactivateLatestRentalForProperty,
  updateRental,
} from "@/lib/rentals";
import type { IrlData, Property, Rental, TenantFormValues } from "@/lib/types";

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
  rentDueDay: "5",
};

export function usePropertyDetail(id?: string) {
  const [bien, setBien] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState<TenantFormValues>(emptyTenantForm);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [editRent, setEditRent] = useState("");
  const [editCharges, setEditCharges] = useState("");
  const [irlData, setIrlData] = useState<IrlData | null>(null);
  const [isLoadingIrl, setIsLoadingIrl] = useState(false);

  const tenant: Rental | null = bien ? getActiveRental(bien) : null;

  async function loadDetails() {
    if (!id) return;
    const propertyData = await fetchPropertyById(id);
    if (propertyData) setBien(propertyData);
    setLoading(false);
  }

  useEffect(() => {
    if (id) loadDetails();
  }, [id]);

  function setTenantField<K extends keyof TenantFormValues>(key: K, value: TenantFormValues[K]) {
    setTenantForm((current) => ({ ...current, [key]: value }));
  }

  async function handleStatusChange(newStatus: string) {
    if (!id || !bien || newStatus === bien.status) return;
    await updatePropertyStatus(id, newStatus);

    if (newStatus === "Vacant" || newStatus === "Vendu") {
      await archiveRentalsForProperty(id);
    }

    const shouldAddTenant = newStatus === "Loué" && !tenant;
    if (shouldAddTenant) {
      const reactivatedId = await reactivateLatestRentalForProperty(id);
      await loadDetails();
      if (!reactivatedId) openTenantModal();
      return;
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
        rentDueDay: String(tenant.rent_due_day && tenant.rent_due_day >= 1 ? tenant.rent_due_day : 5),
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

  async function handleSaveRent(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    await updatePropertyRent(id, parseFloat(editRent) || 0, parseFloat(editCharges) || 0);
    setIsRentModalOpen(false);
    await loadDetails();
  }

  async function handleSaveTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    if (tenant) {
      const { error } = await updateRental(tenant.id, id, tenantForm);
      if (error) {
        alert("Impossible d’enregistrer le locataire : " + error.message);
        return;
      }
    } else {
      const { error } = await createRental(id, tenantForm);
      if (error) {
        alert("Impossible d’ajouter le locataire : " + error.message);
        return;
      }
      await updatePropertyStatus(id, "Loué");
    }

    setIsTenantModalOpen(false);
    await loadDetails();
  }

  return {
    bien,
    loading,
    tenant,
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
    handleSaveRent,
    handleSaveTenant,
  };
}
