import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";

export function LeaseToolbar({ propertyId, onPrint }: { propertyId: string; onPrint: () => void }) {
  return (
    <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between print:hidden">
      <BackButton href={`/bien/${propertyId}`} label="Retour à la fiche du bien" />
      <Button onClick={onPrint}>Imprimer / Enregistrer en PDF</Button>
    </div>
  );
}
