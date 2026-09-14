"use client";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { PropertyCard } from "@/components/dashboard/PropertyCard";
import { PropertyFormModal } from "@/components/dashboard/PropertyFormModal";
import { PendingInvitesBanner } from "@/components/coowners/PendingInvitesBanner";
import { usePropertiesDashboard } from "@/hooks/usePropertiesDashboard";

export default function BiensPage() {
  const dashboard = usePropertiesDashboard();
  const pm = dashboard.properties.filter((p) => p.ownership_type !== "entreprise");
  const entreprise = dashboard.properties.filter((p) => p.ownership_type === "entreprise");

  return (
    <main className="space-y-6 p-4 md:p-6">
      <DashboardHeader onAdd={dashboard.openCreateModal} />

      <PendingInvitesBanner />

      {dashboard.properties.length === 0 ? (
        <p className="rounded-xl bg-card py-12 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Aucun bien enregistré pour le moment.
        </p>
      ) : (
        <div className="space-y-8">
          {pm.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Personne morale ({pm.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pm.map((bien) => (
                  <PropertyCard
                    key={bien.id}
                    bien={bien}
                    onEdit={dashboard.selectPropertyToEdit}
                    onDelete={(property) => dashboard.handleDeleteFromList(property.id)}
                  />
                ))}
              </div>
            </section>
          )}
          {entreprise.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Entreprise ({entreprise.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {entreprise.map((bien) => (
                  <PropertyCard
                    key={bien.id}
                    bien={bien}
                    onEdit={dashboard.selectPropertyToEdit}
                    onDelete={(property) => dashboard.handleDeleteFromList(property.id)}
                  />
                ))}
              </div>
            </section>
          )}
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
    </main>
  );
}
