"use client";

import Link from "next/link";
import { MissingCostsTableCard } from "@/components/calculator/MissingCostsTableCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { useCalculatorOverview } from "@/hooks/useCalculatorOverview";
import { formatEuro, formatStreetAddress } from "@/lib/format";

export default function CalculateurPage() {
  const overview = useCalculatorOverview();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calculateur</h1>
        <p className="text-sm text-muted-foreground">
          Dépenses propriétaire, loyer d&apos;équilibre et rentabilité dans le temps
        </p>
      </div>

      {overview.error && <ErrorNotice message={overview.error} />}

      {overview.missingTable && <MissingCostsTableCard />}

      {overview.loading ? (
        <p className="text-sm text-muted-foreground">Chargement...</p>
      ) : overview.rows.length === 0 ? (
        <p className="rounded-xl bg-card py-12 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Ajoute un bien pour commencer le calcul de rentabilité.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {overview.rows.map(({ property, summary }) => (
            <Link key={property.id} href={`/calculateur/${property.id}`} className="block">
              <Card className="h-full transition-colors hover:bg-muted/20">
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{formatStreetAddress(property)}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {property.city} · loyer actuel {formatEuro(Number(property.base_rent_price || 0), 0)}
                    </p>
                  </div>
                  <StatusBadge status={property.status} />
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Loyer d&apos;équilibre</p>
                    <p className="font-semibold">
                      {summary ? formatEuro(summary.breakEven, 0) : "À renseigner"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cash-flow / mois</p>
                    <p className={`font-semibold ${!summary ? "" : summary.monthlyCashflow < 0 ? "text-red-400" : "text-emerald-400"}`}>
                      {summary ? formatEuro(summary.monthlyCashflow, 0) : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
