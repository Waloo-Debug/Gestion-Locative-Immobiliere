import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";

export function ReceiptToolbar({ backHref, onPrint }: { backHref: string; onPrint: () => void }) {
  return (
    <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between print:hidden">
      <BackButton href={backHref} label="Retour aux quittances" />
      <Button onClick={onPrint}>Imprimer / Enregistrer en PDF</Button>
    </div>
  );
}
