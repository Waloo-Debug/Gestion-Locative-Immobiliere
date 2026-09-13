"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/ui/InfoHint";
import { formatEuro } from "@/lib/format";
import type { CostSlice } from "@/lib/profitability";
import { profitabilitySummary } from "@/lib/profitability";
import { TERM_DEFINITIONS, type TermKey } from "@/lib/termDefinitions";

const CHART_TERM_HINTS: Partial<Record<string, TermKey>> = {
  pno: "pno",
  cfe: "cfe",
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: { label?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="font-medium">{item.payload?.label || item.name}</p>
      <p className="text-muted-foreground">{formatEuro(Number(item.value || 0), 2)} / mois</p>
    </div>
  );
}

export function ProfitabilityCharts({
  costSlices,
  summary,
  simulatedRent,
}: {
  costSlices: CostSlice[];
  summary: ReturnType<typeof profitabilitySummary>;
  simulatedRent: number;
}) {
  const occupancyRent = simulatedRent * summary.occupancy;
  const cashflowPositive = Math.max(0, summary.monthlyCashflow);
  const uncovered = Math.max(0, -summary.monthlyCashflow);

  const balanceData = [
    { key: "costs", label: "Dépenses", value: summary.monthlyCost, color: "#f87171" },
    ...(cashflowPositive > 0
      ? [{ key: "profit", label: "Bénéfice", value: cashflowPositive, color: "#34d399" }]
      : []),
    ...(uncovered > 0
      ? [{ key: "gap", label: "Manque à gagner", value: uncovered, color: "#fbbf24" }]
      : []),
  ].filter((item) => item.value > 0.005);

  const rentShare = occupancyRent > 0 ? Math.min(100, (summary.monthlyCost / occupancyRent) * 100) : 100;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Répartition des coûts mensuels</CardTitle>
        </CardHeader>
        <CardContent>
          {costSlices.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Saisis des dépenses pour afficher le camembert.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costSlices}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {costSlices.map((slice) => (
                        <Cell key={slice.key} fill={slice.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2 text-sm">
                {costSlices.map((slice) => {
                  const termKey = CHART_TERM_HINTS[slice.key];
                  return (
                    <li key={slice.key} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                        <span className="inline-flex items-center gap-1.5">
                          {slice.label}
                          {termKey ? (
                            <InfoHint
                              term={termKey.toUpperCase()}
                              definition={TERM_DEFINITIONS[termKey]}
                            />
                          ) : null}
                        </span>
                      </span>
                      <span className="font-medium">{formatEuro(slice.value, 0)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loyer vs dépenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center">
            <div className="relative h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={balanceData.length ? balanceData : [{ key: "empty", label: "Vide", value: 1, color: "#334155" }]}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="transparent"
                  >
                    {(balanceData.length ? balanceData : [{ key: "empty", color: "#334155" }]).map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <p className="text-xs text-muted-foreground">Cash-flow / mois</p>
                <p className={`text-lg font-semibold ${summary.monthlyCashflow < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {formatEuro(summary.monthlyCashflow, 0)}
                </p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Loyer encaissé*</p>
                <p className="font-semibold">{formatEuro(occupancyRent, 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Dépenses</p>
                <p className="font-semibold">{formatEuro(summary.monthlyCost, 0)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Part des coûts</p>
                <p className="font-semibold">{rentShare.toFixed(0)} %</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                * après prise en compte de la vacance locative
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
