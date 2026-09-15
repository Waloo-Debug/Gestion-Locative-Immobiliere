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
import type { Rental, TenantFormValues } from "@/lib/types";

export function TenantModal({
  open,
  tenant,
  form,
  onChange,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  tenant: Rental | null;
  form: TenantFormValues;
  onChange: <K extends keyof TenantFormValues>(key: K, value: TenantFormValues[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{tenant ? "Modifier le locataire" : "Nouveau locataire"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Prénom (Locataire 1)" required value={form.t1FirstName} onChange={(v) => onChange("t1FirstName", v)} />
            <Field label="Nom (Locataire 1)" required value={form.t1LastName} onChange={(v) => onChange("t1LastName", v)} />
            <Field label="Prénom (Locataire 2)" value={form.t2FirstName} onChange={(v) => onChange("t2FirstName", v)} />
            <Field label="Nom (Locataire 2)" value={form.t2LastName} onChange={(v) => onChange("t2LastName", v)} />
            <Field label="E-mail" type="email" required value={form.tEmail} onChange={(v) => onChange("tEmail", v)} />
            <Field label="N° téléphone" type="tel" value={form.tPhone} onChange={(v) => onChange("tPhone", v)} />
            <Field label="N° de rue" value={form.tStreetNumber} onChange={(v) => onChange("tStreetNumber", v)} />
            <Field label="Nom de rue" value={form.tStreetName} onChange={(v) => onChange("tStreetName", v)} />
            <Field label="Code postal" value={form.tPostalCode} onChange={(v) => onChange("tPostalCode", v)} />
            <Field label="Ville" value={form.tCity} onChange={(v) => onChange("tCity", v)} />
          </div>
          <Field
            label="Date d'entrée"
            type="date"
            required
            value={form.tEntryDate}
            onChange={(v) => onChange("tEntryDate", v)}
          />
          <div className="space-y-1.5">
            <Label htmlFor="rent-due-day">Jour de virement / rappel (1–28)</Label>
            <Input
              id="rent-due-day"
              type="number"
              min={1}
              max={28}
              required
              value={form.rentDueDay}
              onChange={(e) => onChange("rentDueDay", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Les détenteurs reçoivent un rappel à partir de ce jour chaque mois, jusqu’à confirmation du paiement.
            </p>
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

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
