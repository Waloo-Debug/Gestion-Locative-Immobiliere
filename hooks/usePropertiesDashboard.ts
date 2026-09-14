"use client";

import { useEffect, useState } from "react";
import {
  createProperty,
  deleteProperty,
  fetchProperties,
  updateProperty,
} from "@/lib/properties";
import { toErrorMessage } from "@/lib/errors";
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
};

export function usePropertiesDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isEditSelectOpen, setIsEditSelectOpen] = useState(false);
  const [isDeleteSelectOpen, setIsDeleteSelectOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyFormValues>(emptyForm);

  async function loadProperties() {
    try {
      setProperties(await fetchProperties());
      setError(null);
    } catch (err) {
      // Sans cela, un refus RLS ou une panne réseau s'afficherait comme « aucun bien ».
      setError(toErrorMessage(err, "Impossible de charger les biens."));
    }
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
    });
  }

  function selectPropertyToEdit(bien: Property) {
    setEditingId(bien.id);
    fillFormFromProperty(bien);
    setIsEditSelectOpen(false);
    setIsModalOpen(true);
  }

  async function handleDeleteFromList(id: string) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce bien ?")) return;
    try {
      await deleteProperty(id);
    } catch (err) {
      alert(toErrorMessage(err, "La suppression a échoué."));
      return;
    }
    setIsDeleteSelectOpen(false);
    await loadProperties();
  }

  async function handleSubmitProperty(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await updateProperty(editingId, form);
      } else {
        await createProperty(form);
      }
      resetForm();
    } catch (err) {
      // Le formulaire reste ouvert pour permettre une correction.
      alert(toErrorMessage(err, "L'enregistrement du bien a échoué."));
    } finally {
      setLoading(false);
    }

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
    error,
    isEditSelectOpen,
    setIsEditSelectOpen,
    isDeleteSelectOpen,
    setIsDeleteSelectOpen,
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
