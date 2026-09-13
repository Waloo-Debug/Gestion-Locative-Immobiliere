import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MoneyField } from "@/components/calculator/MoneyField";
import { TERM_DEFINITIONS } from "@/lib/termDefinitions";
import type { OwnerCostFormValues } from "@/lib/types";

export function OwnerCostsForm({
  form,
  saving,
  onChange,
  onSubmit,
}: {
  form: OwnerCostFormValues;
  saving: boolean;
  onChange: <K extends keyof OwnerCostFormValues>(key: K, value: OwnerCostFormValues[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Acquisition</CardTitle>
        </CardHeader>
        <CardContent>
          <MoneyField
            label="Prix d'achat"
            value={form.purchasePrice}
            onChange={(value) => onChange("purchasePrice", value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crédit et assurances</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            label="Mensualité de crédit"
            value={form.monthlyLoan}
            onChange={(value) => onChange("monthlyLoan", value)}
          />
          <MoneyField
            label="Assurance emprunteur / mois"
            value={form.monthlyLoanInsurance}
            onChange={(value) => onChange("monthlyLoanInsurance", value)}
          />
          <MoneyField
            label="Assurance PNO / mois"
            value={form.monthlyPnoInsurance}
            onChange={(value) => onChange("monthlyPnoInsurance", value)}
            hint={{ term: "PNO", definition: TERM_DEFINITIONS.pno }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Charges récurrentes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            label="Charges non récupérables / mois"
            value={form.monthlyCondoCharges}
            onChange={(value) => onChange("monthlyCondoCharges", value)}
          />
          <MoneyField
            label="Frais de gestion / mois"
            value={form.monthlyManagementFees}
            onChange={(value) => onChange("monthlyManagementFees", value)}
          />
          <MoneyField
            label="Autres dépenses / mois"
            value={form.monthlyOther}
            onChange={(value) => onChange("monthlyOther", value)}
          />
          <MoneyField
            label="Taxe foncière / an"
            value={form.annualPropertyTax}
            onChange={(value) => onChange("annualPropertyTax", value)}
          />
          <MoneyField
            label="CFE / an"
            value={form.annualCfe}
            onChange={(value) => onChange("annualCfe", value)}
            hint={{ term: "CFE", definition: TERM_DEFINITIONS.cfe }}
          />
          <MoneyField
            label="Provision travaux / an"
            value={form.annualWorksProvision}
            onChange={(value) => onChange("annualWorksProvision", value)}
          />
          <MoneyField
            label="Autres dépenses / an"
            value={form.annualOther}
            onChange={(value) => onChange("annualOther", value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hypothèses</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <MoneyField
            label="Vacance locative"
            value={form.vacancyMonthsPerYear}
            onChange={(value) => onChange("vacancyMonthsPerYear", value)}
            suffix="mois/an"
          />
          <MoneyField
            label="Revalo. loyer / an"
            value={form.annualRentIncreasePercent}
            onChange={(value) => onChange("annualRentIncreasePercent", value)}
            suffix="%"
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <textarea
              value={form.notes}
              onChange={(event) => onChange("notes", event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer les dépenses"}
      </Button>
    </form>
  );
}
