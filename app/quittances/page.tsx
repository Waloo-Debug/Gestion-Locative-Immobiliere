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
import { useReceiptsPage } from "@/hooks/useReceiptsPage";
import { formatDateFr, formatStreetAddress, tenantDisplayName } from "@/lib/format";
import { formatPeriodLabel, parseQuittanceFileName, quittanceHref } from "@/lib/receipts";

export default function QuittancesPage() {
  const receiptsPage = useReceiptsPage();

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quittances</h1>
        <p className="text-sm text-muted-foreground">
          Génération mensuelle des quittances de loyer pour chaque locataire actif
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jour de génération</CardTitle>
            <CardDescription>
              Chaque mois, les quittances sont créées à partir de ce jour. L&apos;envoi automatique par e-mail sera
              ajouté ensuite.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Jour du mois</Label>
              <Select
                value={String(receiptsPage.generationDay)}
                onValueChange={(value) => {
                  const day = Number(value);
                  if (day >= 1 && day <= 28) receiptsPage.saveDay(day);
                }}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, index) => (
                    <SelectItem key={index + 1} value={String(index + 1)}>
                      {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              {receiptsPage.saving ? "Enregistrement..." : `Actuel : le ${receiptsPage.generationDay} de chaque mois`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Générer une période</CardTitle>
            <CardDescription>
              {receiptsPage.activeTenants.length} locataire
              {receiptsPage.activeTenants.length > 1 ? "s" : ""} actif
              {receiptsPage.activeTenants.length > 1 ? "s" : ""}. Une quittance par locataire, sans doublon.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Période</Label>
              <Select value={receiptsPage.period} onValueChange={(value) => value && receiptsPage.setPeriod(value)}>
                <SelectTrigger className="w-48 capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {receiptsPage.periods.map((period) => (
                    <SelectItem key={period} value={period}>
                      <span className="capitalize">{formatPeriodLabel(period)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => receiptsPage.generate()} disabled={receiptsPage.generating}>
              {receiptsPage.generating ? "Génération..." : "Générer les quittances"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {receiptsPage.message && (
        <p className="text-sm text-muted-foreground">{receiptsPage.message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {receiptsPage.receipts.length} quittance{receiptsPage.receipts.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receiptsPage.loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chargement...</p>
          ) : receiptsPage.receipts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune quittance générée.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Émise le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receiptsPage.receipts.map((receipt) => {
                  const parsed = parseQuittanceFileName(receipt.file_name);
                  const property = receiptsPage.properties.find((item) => item.id === receipt.property_id) ?? null;
                  const rental =
                    property?.rentals.find((item) => item.id === (receipt.rental_id || parsed?.rentalId)) ?? null;
                  const period = parsed?.period;
                  return (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">
                        {rental ? tenantDisplayName(rental) : "Locataire"}
                      </TableCell>
                      <TableCell>
                        {property ? (
                          <Link href={`/bien/${property.id}`} className="hover:underline">
                            {formatStreetAddress(property)}
                          </Link>
                        ) : (
                          "Bien inconnu"
                        )}
                      </TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {period ? formatPeriodLabel(period) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateFr(receipt.created_at)}</TableCell>
                      <TableCell>
                        <StatusBadge status="Émise" />
                      </TableCell>
                      <TableCell className="text-right">
                        {property && rental && period ? (
                          <ViewLink href={quittanceHref(property.id, rental.id, period)} />
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
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
