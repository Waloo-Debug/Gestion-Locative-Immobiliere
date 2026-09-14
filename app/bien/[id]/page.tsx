"use client";

import { useParams } from "next/navigation";
import { CurrentRentalCard } from "@/components/property/CurrentRentalCard";
import { PropertyDocumentPanel } from "@/components/property/PropertyDocumentPanel";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { RentModal } from "@/components/property/RentModal";
import { TenantModal } from "@/components/property/TenantModal";
import { CoownersPanel } from "@/components/coowners/CoownersPanel";
import { BackButton } from "@/components/ui/BackButton";
import { usePropertyDetail } from "@/hooks/usePropertyDetail";

export default function BienDetail() {
  const params = useParams();
  const id = params.id as string;
  const detail = usePropertyDetail(id);

  if (detail.loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement des détails...</div>;
  }
  if (!detail.bien) {
    return <div className="p-8 text-center text-destructive">Bien introuvable.</div>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <BackButton href="/biens" label="Retour aux biens" />

      <PropertyHeader bien={detail.bien} onEditRent={detail.openRentModal} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)] lg:items-start">
        <CurrentRentalCard
          bien={detail.bien}
          tenant={detail.tenant}
          onStatusChange={detail.handleStatusChange}
          onEditTenant={detail.openTenantModal}
        />
        <CoownersPanel propertyId={detail.bien.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <PropertyDocumentPanel
          propertyId={detail.bien.id}
          title="Diagnostics"
          description="Stocke les diagnostics du bien (DPE, amiante, plomb, électricité…). Tu peux les télécharger à tout moment."
          categories={[{ label: "Diagnostics", documentType: "Diagnostic" }]}
        />
        <PropertyDocumentPanel
          propertyId={detail.bien.id}
          title="État des lieux"
          description="Ajoute l’état des lieux d’entrée ou de sortie, par glisser-déposer ou via Parcourir."
          rentalId={detail.tenant?.id}
          categories={[
            { label: "Entrée", documentType: "EtatDesLieuxEntree" },
            { label: "Sortie", documentType: "EtatDesLieuxSortie" },
          ]}
        />
      </div>

      <TenantModal
        open={detail.isTenantModalOpen}
        tenant={detail.tenant}
        form={detail.tenantForm}
        onChange={detail.setTenantField}
        onSubmit={detail.handleSaveTenant}
        onCancel={() => detail.setIsTenantModalOpen(false)}
      />

      <RentModal
        open={detail.isRentModalOpen}
        irlData={detail.irlData}
        isLoadingIrl={detail.isLoadingIrl}
        editRent={detail.editRent}
        editCharges={detail.editCharges}
        onRentChange={detail.setEditRent}
        onChargesChange={detail.setEditCharges}
        onSubmit={detail.handleSaveRent}
        onCancel={() => detail.setIsRentModalOpen(false)}
      />
    </main>
  );
}
