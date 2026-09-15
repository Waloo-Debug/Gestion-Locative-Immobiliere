"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ViewLink } from "@/components/ui/ViewLink";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import {
  PERIOD_ALL,
  PROPERTY_ALL,
  paymentStatusLabel,
  useReceiptsPage,
} from "@/hooks/useReceiptsPage";
import { formatDateFr, formatStreetAddress, tenantDisplayName } from "@/lib/format";
import { propertyLabelOf, rentDueDayOf } from "@/lib/rentPayments";
import { formatPeriodLabel, quittanceHref } from "@/lib/receipts";

export default function QuittancesPage() {
  const page = useReceiptsPage();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quittances</h1>
          <p className="text-sm text-muted-foreground">
            Confirmez les loyers reçus : la quittance PDF part alors au locataire.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>Bien</Label>
            <Select
              value={page.propertyId}
              onValueChange={(value) => value && page.setPropertyId(value)}
            >
              <SelectTrigger className="w-72 max-w-[min(100vw-2rem,24rem)]">
                <SelectValue placeholder="Tous les biens">
                  {(value) => {
                    if (!value || value === PROPERTY_ALL) return "Tous les biens";
                    const selected = page.properties.find((p) => p.id === value);
                    return selected ? page.propertyFilterLabel(selected) : "Tous les biens";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROPERTY_ALL}>Tous les biens</SelectItem>
                {page.properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {page.propertyFilterLabel(property)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Période</Label>
            <Select value={page.period} onValueChange={(value) => value && page.setPeriod(value)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Choisir une période">
                  {(value) => page.periodFilterLabel(typeof value === "string" ? value : PERIOD_ALL)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PERIOD_ALL}>Tout l’historique</SelectItem>
                {page.periods.map((period) => (
                  <SelectItem key={period} value={period}>
                    <span className="capitalize">{formatPeriodLabel(period)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {page.error && <ErrorNotice message={page.error} />}
      {page.actionError && <ErrorNotice message={page.actionError} />}
      {page.message && <p className="text-sm text-muted-foreground">{page.message}</p>}

      <Card>
        <CardHeader>
          <CardTitle>
            {page.pending.length} loyer{page.pending.length > 1 ? "s" : ""} à confirmer
          </CardTitle>
          <CardDescription>
            Les détenteurs reçoivent un rappel à partir du jour de virement de chaque locataire, jusqu’à
            confirmation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {page.loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
          ) : page.pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun loyer en attente pour {page.periodFilterLabel(page.period).toLowerCase()}.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Bien</TableHead>
                  {page.showPeriodColumn && <TableHead>Période</TableHead>}
                  <TableHead>Jour rappel</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.pending.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.rental ? tenantDisplayName(row.rental) : "Locataire"}
                    </TableCell>
                    <TableCell>
                      {row.property ? (
                        <Link href={`/bien/${row.property.id}`} className="hover:underline">
                          {formatStreetAddress(row.property)}
                        </Link>
                      ) : (
                        "Bien inconnu"
                      )}
                    </TableCell>
                    {page.showPeriodColumn && (
                      <TableCell className="capitalize text-muted-foreground">
                        {formatPeriodLabel(row.period)}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">Le {rentDueDayOf(row.rental)}</TableCell>
                    <TableCell>
                      <StatusBadge status={paymentStatusLabel(row)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={page.actingId === row.id}
                        onClick={() => page.confirmPayment(row.id)}
                      >
                        {page.actingId === row.id ? "Envoi..." : "Confirmer le paiement"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique — {page.periodFilterLabel(page.period)}</CardTitle>
          <CardDescription>
            {page.history.length} paiement{page.history.length > 1 ? "s" : ""} suivi
            {page.history.length > 1 ? "s" : ""}
            {page.propertyId !== PROPERTY_ALL ? " pour ce bien" : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {page.loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
          ) : page.history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun paiement pour ce filtre.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Bien</TableHead>
                  {page.showPeriodColumn && <TableHead>Période</TableHead>}
                  <TableHead>Confirmé le</TableHead>
                  <TableHead>Envoyée le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.history.map((row) => {
                  const canView =
                    row.property && row.rental && row.status === "paid"
                      ? quittanceHref(row.property.id, row.rental.id, row.period)
                      : null;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.rental ? tenantDisplayName(row.rental) : "Locataire"}
                      </TableCell>
                      <TableCell>
                        {row.property ? propertyLabelOf(row.property) : "Bien inconnu"}
                      </TableCell>
                      {page.showPeriodColumn && (
                        <TableCell className="capitalize text-muted-foreground">
                          {formatPeriodLabel(row.period)}
                        </TableCell>
                      )}
                      <TableCell className="text-muted-foreground">
                        {row.paid_at ? formatDateFr(row.paid_at) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.quittance_sent_at ? formatDateFr(row.quittance_sent_at) : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={paymentStatusLabel(row)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {row.status === "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={page.actingId === row.id}
                              onClick={() => page.resendQuittance(row.id)}
                            >
                              {page.actingId === row.id ? "Envoi..." : "Renvoyer"}
                            </Button>
                          )}
                          {canView ? <ViewLink href={canView} /> : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
