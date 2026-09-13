import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEuro } from "@/lib/format";
import { profitabilitySummary } from "@/lib/profitability";

export function ProfitabilityKpis({
  currentRent,
  summary,
}: {
  currentRent: number;
  summary: ReturnType<typeof profitabilitySummary>;
}) {
  const items = [
    { label: "Loyer simulé HC", value: formatEuro(currentRent, 2) },
    { label: "Loyer d'équilibre HC", value: formatEuro(summary.breakEven, 2) },
    {
      label: "Écart",
      value: `${summary.rentGap >= 0 ? "+" : ""}${formatEuro(summary.rentGap, 2)}`,
    },
    { label: "Dépenses / mois", value: formatEuro(summary.monthlyCost, 2) },
    { label: "Cash-flow / mois", value: formatEuro(summary.monthlyCashflow, 2) },
    { label: "Cash-flow / an", value: formatEuro(summary.annualCashflow, 2) },
    {
      label: "Rentabilité brute",
      value: summary.grossYield == null ? "—" : `${summary.grossYield.toFixed(2)} %`,
    },
    {
      label: "Rentabilité nette",
      value: summary.netYield == null ? "—" : `${summary.netYield.toFixed(2)} %`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
