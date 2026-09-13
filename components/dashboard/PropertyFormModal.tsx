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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PropertyFormValues, PropertyType } from "@/lib/types";

export function PropertyFormModal({
  open,
  title,
  form,
  loading,
  onChange,
  onTypeChange,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  title: string;
  form: PropertyFormValues;
  loading: boolean;
  onChange: <K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) => void;
  onTypeChange: (type: PropertyType) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-2xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="propertyType">Type de bien</Label>
              <Select value={form.propertyType} onValueChange={(value) => {
                if (value === "Appartement" || value === "Maison") onTypeChange(value);
              }}>
                <SelectTrigger id="propertyType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appartement">Appartement</SelectItem>
                  <SelectItem value="Maison">Maison</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Nom de rue *" value={form.streetName} onChange={(value) => onChange("streetName", value)} required />
            <Field label="N° de rue" value={form.streetNumber} onChange={(value) => onChange("streetNumber", value)} />
            <Field label="Ville *" value={form.city} onChange={(value) => onChange("city", value)} required />
            <Field
              label="Département (ex: 75000) *"
              value={form.department}
              onChange={(value) => onChange("department", value)}
              required
            />
            {form.propertyType === "Appartement" && (
              <>
                <Field
                  label="N° d'appartement"
                  value={form.apartmentNumber}
                  onChange={(value) => onChange("apartmentNumber", value)}
                />
                <Field label="Étage" value={form.floor} onChange={(value) => onChange("floor", value)} />
                <Field
                  label="N° de bâtiment"
                  value={form.buildingNumber}
                  onChange={(value) => onChange("buildingNumber", value)}
                />
              </>
            )}
          </div>
          <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input required={required} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
