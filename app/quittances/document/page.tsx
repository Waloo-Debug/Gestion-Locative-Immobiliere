"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptDocument } from "@/components/receipt/ReceiptDocument";
import { ReceiptToolbar } from "@/components/receipt/ReceiptToolbar";
import { BackButton } from "@/components/ui/BackButton";
import { fetchOwnerProfilesForProperty } from "@/lib/coowners";
import { fetchDocuments } from "@/lib/documents";
import { fetchPropertyById } from "@/lib/properties";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

function QuittanceDocumentView() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("propertyId") || "";
  const rentalId = searchParams.get("rentalId") || "";
  const period = searchParams.get("period") || "";

  const [bien, setBien] = useState<Property | null>(null);
  const [owners, setOwners] = useState<OwnerProfile[]>([]);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    async function load() {
      const [property, profiles, documents] = await Promise.all([
        fetchPropertyById(propertyId),
        fetchOwnerProfilesForProperty(propertyId),
        fetchDocuments(),
      ]);
      setBien(property);
      setOwners(profiles);
      const receipt = documents.find(
        (document) =>
          document.document_type === "Quittance" &&
          document.property_id === propertyId &&
          (document.rental_id === rentalId || document.file_name.includes(rentalId)) &&
          document.file_name.includes(period),
      );
      setIssuedAt(receipt?.created_at || null);
      setLoading(false);
    }
    load();
  }, [propertyId, rentalId, period]);

  const tenant: Rental | null = bien?.rentals.find((rental) => rental.id === rentalId) ?? null;

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement de la quittance...</div>;
  }
  if (!bien || !tenant || !period) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Quittance introuvable.</p>
        <BackButton href="/quittances" label="Retour aux quittances" className="mt-4" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-8">
      <ReceiptToolbar backHref="/quittances" onPrint={() => window.print()} />
      <ReceiptDocument
        bien={bien}
        tenant={tenant}
        owners={owners}
        period={period}
        issuedAt={issuedAt}
      />
    </main>
  );
}

export default function QuittanceDocumentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Chargement de la quittance...</div>}>
      <QuittanceDocumentView />
    </Suspense>
  );
}
