"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOwnerProfile } from "@/components/profile/OwnerProfileProvider";
import { ReceiptDocument } from "@/components/receipt/ReceiptDocument";
import { ReceiptToolbar } from "@/components/receipt/ReceiptToolbar";
import { BackButton } from "@/components/ui/BackButton";
import { fetchDocuments } from "@/lib/documents";
import { fetchOwnerProfile } from "@/lib/owners";
import { fetchPropertyById } from "@/lib/properties";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

function QuittanceDocumentView() {
  const searchParams = useSearchParams();
  const { profile: contextProfile } = useOwnerProfile();
  const propertyId = searchParams.get("propertyId") || "";
  const rentalId = searchParams.get("rentalId") || "";
  const period = searchParams.get("period") || "";

  const [bien, setBien] = useState<Property | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [issuedAt, setIssuedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    async function load() {
      const [property, profile, documents] = await Promise.all([
        fetchPropertyById(propertyId),
        fetchOwnerProfile(),
        fetchDocuments(),
      ]);
      setBien(property);
      setOwner(profile);
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
        owner={owner || contextProfile}
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
