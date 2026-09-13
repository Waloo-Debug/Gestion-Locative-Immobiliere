import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IrlData } from "@/lib/types";

export function RentModal({
  open,
  irlData,
  isLoadingIrl,
  editRent,
  editCharges,
  onRentChange,
  onChargesChange,
  onApplyIrl,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  irlData: IrlData | null;
  isLoadingIrl: boolean;
  editRent: string;
  editCharges: string;
  onRentChange: (value: string) => void;
  onChargesChange: (value: string) => void;
  onApplyIrl: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Modifier le loyer</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg bg-muted/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Indice IRL (INSEE)
            </span>
            {isLoadingIrl ? (
              <span className="text-xs text-muted-foreground">Recherche...</span>
            ) : irlData ? (
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                {irlData.quarter} : +{irlData.rate}%
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Indisponible</span>
            )}
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            L&apos;augmentation annuelle est encadrée par l&apos;Indice de Référence des Loyers.
          </p>
          <Button type="button" className="w-full" onClick={onApplyIrl} disabled={!irlData || isLoadingIrl}>
            Appliquer l&apos;augmentation (+{irlData?.rate || 0}%)
          </Button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Loyer de base (HC) en €</Label>
            <Input type="number" step="0.01" required value={editRent} onChange={(e) => onRentChange(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Charges en €</Label>
            <Input type="number" step="0.01" value={editCharges} onChange={(e) => onChargesChange(e.target.value)} />
          </div>
          <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
