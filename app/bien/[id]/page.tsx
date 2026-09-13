"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CurrentRentalCard } from "@/components/property/CurrentRentalCard";
import { DocumentsSection } from "@/components/property/DocumentsSection";
import { PropertyHeader } from "@/components/property/PropertyHeader";
import { RentModal } from "@/components/property/RentModal";
import { TenantModal } from "@/components/property/TenantModal";
import { BackButton } from "@/components/ui/BackButton";
import { buttonVariants } from "@/components/ui/button";
import { usePropertyDetail } from "@/hooks/usePropertyDetail";
import { cn } from "@/lib/utils";

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
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <BackButton href="/biens" label="Retour aux biens" />
        <Link href={`/calculateur/${id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Calculateur
        </Link>
      </div>

      <PropertyHeader bien={detail.bien} onEditRent={detail.openRentModal} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <CurrentRentalCard
          bien={detail.bien}
          tenant={detail.tenant}
          onStatusChange={detail.handleStatusChange}
          onEditTenant={detail.openTenantModal}
        />
        <DocumentsSection propertyId={detail.bien.id} bails={detail.bails} quittances={detail.quittances} />
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
        onApplyIrl={detail.applyIrlToRent}
        onSubmit={detail.handleSaveRent}
        onCancel={() => detail.setIsRentModalOpen(false)}
      />
    </main>
  );
}
