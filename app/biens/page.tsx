"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { PropertyFormModal } from "@/components/dashboard/PropertyFormModal";
import { PropertySelectModal } from "@/components/dashboard/PropertySelectModal";
import { usePropertiesDashboard } from "@/hooks/usePropertiesDashboard";

export default function BiensPage() {
  const dashboard = usePropertiesDashboard();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <DashboardHeader
        onEdit={() => dashboard.setIsEditSelectOpen(true)}
        onDelete={() => dashboard.setIsDeleteSelectOpen(true)}
        onAdd={dashboard.openCreateModal}
      />

      {dashboard.properties.length === 0 ? (
        <p className="rounded-xl bg-card py-12 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Aucun bien enregistré pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {dashboard.properties.map((bien) => (
            <PropertyCard key={bien.id} bien={bien} />
          ))}
        </div>
      )}

      <PropertyFormModal
        open={dashboard.isModalOpen}
        title={dashboard.editingId ? "Modifier le bien immobilier" : "Ajouter un bien immobilier"}
        form={dashboard.form}
        loading={dashboard.loading}
        onChange={dashboard.setFormField}
        onTypeChange={dashboard.setPropertyType}
        onSubmit={dashboard.handleSubmitProperty}
        onCancel={dashboard.resetForm}
      />

      <PropertySelectModal
        open={dashboard.isEditSelectOpen}
        title="Quel bien souhaitez-vous modifier ?"
        properties={dashboard.properties}
        onSelect={dashboard.selectPropertyToEdit}
        onCancel={() => dashboard.setIsEditSelectOpen(false)}
      />

      <PropertySelectModal
        open={dashboard.isDeleteSelectOpen}
        title="Quel bien souhaitez-vous supprimer ?"
        properties={dashboard.properties}
        destructive
        onSelect={(bien) => dashboard.handleDeleteFromList(bien.id)}
        onCancel={() => dashboard.setIsDeleteSelectOpen(false)}
      />
    </main>
  );
}
