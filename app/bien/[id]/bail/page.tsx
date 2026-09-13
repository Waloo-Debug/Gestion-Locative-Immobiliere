"use client";

import { useParams } from "next/navigation";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { LeaseToolbar } from "@/components/lease/LeaseToolbar";
import { BackButton } from "@/components/ui/BackButton";
import { useLeaseDocument } from "@/hooks/useLeaseDocument";

export default function BailPage() {
  const params = useParams();
  const id = params.id as string;
  const lease = useLeaseDocument(id);

  if (lease.loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement du bail...</div>;
  }
  if (!lease.bien) {
    return <div className="p-8 text-center text-destructive">Bien non trouvé.</div>;
  }
  if (!lease.tenant) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Ce bien n&apos;a aucun locataire enregistré. Impossible de générer un bail.</p>
        <BackButton href={`/bien/${id}`} label="Retour au bien" className="mt-4" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-8">
      <LeaseToolbar propertyId={lease.bien.id} onPrint={lease.handlePrintAndSave} />
      <LeaseDocument bien={lease.bien} tenant={lease.tenant} owner={lease.owner} />
    </main>
  );
}
