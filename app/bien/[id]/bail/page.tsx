"use client";

import { useParams } from "next/navigation";
import { LeaseDocument } from "@/components/lease/LeaseDocument";
import { LeaseToolbar } from "@/components/lease/LeaseToolbar";
import { BackButton } from "@/components/ui/BackButton";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { useLeaseDocument } from "@/hooks/useLeaseDocument";

export default function BailPage() {
  const params = useParams();
  const id = params.id as string;
  const { bien, owner, tenant, loading, error, saveError, isSaving, handlePrintAndSave } =
    useLeaseDocument(id);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement du bail...</div>;
  }
  if (error) {
    return (
      <div className="p-4 md:p-6">
        <ErrorNotice message={error} />
      </div>
    );
  }
  if (!bien) {
    return <div className="p-8 text-center text-destructive">Bien non trouvé.</div>;
  }
  if (!tenant) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Ce bien n&apos;a aucun locataire enregistré. Impossible de générer un bail.</p>
        <BackButton href={`/bien/${id}`} label="Retour au bien" className="mt-4" />
      </div>
    );
  }

  return (
    <main className="p-4 sm:p-8">
      <LeaseToolbar propertyId={bien.id} onPrint={handlePrintAndSave} disabled={isSaving} />
      {saveError && (
        <p className="mx-auto mb-4 max-w-4xl text-sm text-amber-600 print:hidden">{saveError}</p>
      )}
      <LeaseDocument bien={bien} tenant={tenant} owner={owner} />
    </main>
  );
}
