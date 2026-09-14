import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/button";

export function LeaseToolbar({
  onPrint,
  onDownload,
  isSaving,
  savedLabel,
}: {
  onPrint: () => void;
  onDownload: () => void;
  isSaving?: boolean;
  savedLabel?: string | null;
}) {
  return (
    <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-3 print:hidden">
      <BackButton href="/baux" label="Retour aux baux" />
      <div className="flex flex-wrap items-center gap-2">
        {savedLabel && <span className="text-xs text-muted-foreground">{savedLabel}</span>}
        {isSaving && <span className="text-xs text-muted-foreground">Enregistrement...</span>}
        <Button type="button" variant="outline" onClick={onDownload}>
          Télécharger
        </Button>
        <Button type="button" onClick={onPrint}>
          Imprimer
        </Button>
      </div>
    </div>
  );
}
