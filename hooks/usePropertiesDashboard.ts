"use client";

import { useEffect, useState } from "react";
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  updateProperty,
} from "@/lib/properties";
import type { Property, PropertyFormValues, PropertyType } from "@/lib/types";

const emptyForm: PropertyFormValues = {
  streetNumber: "",
  streetName: "",
  apartmentNumber: "",
  floor: "",
  buildingNumber: "",
  city: "",
  department: "",
  propertyType: "Appartement",
  ownershipType: "personne_morale",
  siret: "",
};

export function usePropertiesDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<PropertyFormValues>(emptyForm);

  async function loadProperties() {
    setProperties(await fetchProperties());
  }

  useEffect(() => {
    loadProperties();
  }, []);

  function setFormField<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setPropertyType(propertyType: PropertyType) {
    setFormField("propertyType", propertyType);
  }

  function fillFormFromProperty(bien: Property) {
    setForm({
      streetNumber: bien.street_number || "",
      streetName: bien.street_name || "",
      apartmentNumber: bien.apartment_number || "",
      floor: bien.floor || "",
      buildingNumber: bien.building_number || "",
      city: bien.city || "",
      department: bien.department || "",
      propertyType: bien.property_type,
      ownershipType: bien.ownership_type || "personne_morale",
      siret: bien.siret || "",
    });
  }

  function selectPropertyToEdit(bien: Property) {
    setEditingId(bien.id);
    fillFormFromProperty(bien);
    setIsModalOpen(true);
  }

  async function handleDeleteFromList(id: string) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce bien ?")) return;
    const { error } = await deleteProperty(id);
    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
      return;
    }
    await loadProperties();
  }

  async function handleSubmitProperty(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      const { error } = await updateProperty(editingId, form);
      setLoading(false);
      if (error) {
        alert("Erreur lors de la modification : " + error.message);
        return;
      }
    } else {
      const { error } = await createProperty(form);
      setLoading(false);
      if (error) {
        alert("Erreur lors de l'ajout du bien : " + error.message);
        return;
      }
    }

    resetForm();
    await loadProperties();
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(false);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  return {
    properties,
    isModalOpen,
    editingId,
    loading,
    form,
    setFormField,
    setPropertyType,
    selectPropertyToEdit,
    handleDeleteFromList,
    handleSubmitProperty,
    resetForm,
    openCreateModal,
  };
}
