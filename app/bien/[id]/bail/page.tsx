"use client";

import { useParams } from "next/navigation";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { LeaseToolbar } from "@/components/lease/LeaseToolbar";
import { BackButton } from "@/components/ui/BackButton";
import { useBail } from "./_hooks/useBail";
import type { OwnerProfile, Property, Rental } from "@/lib/types";
import type { BailReadModel, OwnerProfile as BailOwner, Property as BailProperty, Rental as BailRental } from "./_api/types";

function toAppRental(tenant: BailRental): Rental {
  return {
    id: tenant.id,
    tenant_first_name: tenant.tenant_first_name,
    tenant_last_name: tenant.tenant_last_name,
    tenant2_first_name: tenant.tenant2_first_name,
    tenant2_last_name: tenant.tenant2_last_name,
    tenant_email: tenant.tenant_email || "",
    tenant_phone: tenant.tenant_phone,
    tenant_street_number: tenant.tenant_street_number,
    tenant_street_name: tenant.tenant_street_name,
    tenant_city: tenant.tenant_city,
    tenant_postal_code: tenant.tenant_postal_code,
    entry_date: tenant.entry_date,
    is_active: tenant.is_active ?? true,
  };
}

function toAppProperty(bail: BailReadModel): Property {
  const property = bail.property as BailProperty & {
    ownership_type?: string | null;
    siret?: string | null;
  };
  return {
    id: property.id,
    street_number: property.street_number || "",
    street_name: property.street_name || "",
    apartment_number: property.apartment_number || "",
    floor: property.floor || "",
    building_number: property.building_number || "",
    city: property.city || "",
    department: property.department || "",
    property_type: property.property_type,
    status: property.status || undefined,
    ownership_type:
      property.ownership_type === "entreprise" || property.ownership_type === "personne_morale"
        ? property.ownership_type
        : "personne_morale",
    siret: property.siret ?? null,
    base_rent_price: bail.rent.base,
    service_charges: bail.rent.charges,
    rentals: bail.tenant ? [toAppRental(bail.tenant)] : [],
  };
}

function toAppOwner(owner: BailOwner): OwnerProfile {
  return {
    id: owner.id,
    first_name: owner.first_name,
    last_name: owner.last_name,
    email: owner.email,
    phone: owner.phone,
    street_number: owner.street_number,
    street_name: owner.street_name,
    city: owner.city,
    postal_code: owner.postal_code,
    address: owner.address,
  };
}

export default function BailPage() {
  const params = useParams();
  const id = params.id as string;
  const {
    bail,
    owners,
    loading,
    error,
    saveError,
    isSaving,
    savedFileName,
    printBail,
    downloadBail,
  } = useBail(id);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement du bail...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-destructive">{error}</div>;
  }
  if (!bail) {
    return <div className="p-8 text-center text-destructive">Bien non trouvé.</div>;
  }
  if (!bail.tenant) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Ce bien n&apos;a aucun locataire enregistré. Impossible de générer un bail.</p>
        <BackButton href="/baux" label="Retour aux baux" className="mt-4" />
      </div>
    );
  }

  const bien = toAppProperty(bail);
  const tenant = toAppRental(bail.tenant);

  return (
    <main className="p-4 sm:p-8">
      <LeaseToolbar
        onPrint={printBail}
        onDownload={downloadBail}
        isSaving={isSaving}
        savedLabel={savedFileName ? `Enregistré : ${savedFileName}` : null}
      />
      {saveError && (
        <p className="mx-auto mb-4 max-w-4xl text-sm text-amber-600 print:hidden">{saveError}</p>
      )}
      <LeaseDocument bien={bien} tenant={tenant} owners={owners.map(toAppOwner)} />
    </main>
  );
}
