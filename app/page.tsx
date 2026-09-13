"use client";

import Link from "next/link";
import { Building2, Clock, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useOverviewDashboard } from "@/hooks/useOverviewDashboard";
import { formatCityInfo, formatDateFr, formatEuro, formatStreetAddress } from "@/lib/format";
import { formatPeriodLabel, parseQuittanceFileName, quittanceHref } from "@/lib/receipts";

export default function Home() {
  const { properties, receipts, stats, loading } = useOverviewDashboard();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre activité locative</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Biens gérés"
          value={loading ? "—" : String(stats.propertyCount)}
          hint={loading ? "Chargement" : `${stats.rentedCount} loué${stats.rentedCount > 1 ? "s" : ""}`}
          icon={Building2}
        />
        <KpiCard
          title="Locataires"
          value={loading ? "—" : String(stats.tenantCount)}
          hint="actifs"
          icon={Users}
        />
        <KpiCard
          title="Revenus mensuels"
          value={loading ? "—" : formatEuro(stats.monthlyRevenue)}
          hint="charges comprises"
          icon={TrendingUp}
        />
        <KpiCard
          title="Taux d'occupation"
          value={loading ? "—" : `${stats.occupancy}%`}
          hint={`${stats.propertyCount - stats.rentedCount} vacant(s)`}
          icon={Clock}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Dernières quittances</CardTitle>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune quittance générée pour le moment.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bien</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Émise le</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {receipts.map((receipt) => {
                  const parsed = parseQuittanceFileName(receipt.file_name);
                  const rentalId = receipt.rental_id || parsed?.rentalId;
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {receipt.property && parsed && rentalId ? (
                          <Link
                            href={quittanceHref(receipt.property.id, rentalId, parsed.period)}
                            className="hover:underline"
                          >
                            {formatStreetAddress(receipt.property)}
                          </Link>
                        ) : receipt.property ? (
                          formatStreetAddress(receipt.property)
                        ) : (
                          "Bien inconnu"
                        )}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {parsed ? formatPeriodLabel(parsed.period) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateFr(receipt.created_at)}</TableCell>
                      <TableCell>
                        <StatusBadge status="Émise" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupation des biens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucun bien enregistré.</p>
            ) : (
              properties.map((property) => (
                <div key={property.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{formatStreetAddress(property)}</p>
                    <p className="truncate text-xs text-muted-foreground">{formatCityInfo(property)}</p>
                  </div>
                  <StatusBadge status={property.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function KpiCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: typeof Building2;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
