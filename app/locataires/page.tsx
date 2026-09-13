"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { fetchProperties } from "@/lib/properties";
import { formatCityInfo, formatDateFr, formatStreetAddress, tenantDisplayName } from "@/lib/format";
import { getAllTenants } from "@/lib/rentals";
import type { Property } from "@/lib/types";

export default function LocatairesPage() {
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    fetchProperties().then(setProperties);
  }, []);

  const tenants = useMemo(
    () => getAllTenants(properties).sort((a, b) => Number(b.isActive) - Number(a.isActive)),
    [properties],
  );
  const activeCount = tenants.filter((tenant) => tenant.isActive).length;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Locataires</h1>
        <p className="text-sm text-muted-foreground">
          Locataires actifs et historique des anciens occupants
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {tenants.length} locataire{tenants.length > 1 ? "s" : ""}
            {tenants.length > 0 ? ` · ${activeCount} actif${activeCount > 1 ? "s" : ""}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun locataire enregistré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statut</TableHead>
                  <TableHead>Locataire</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Entrée</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map(({ rental, property, isActive }) => (
                  <TableRow key={rental.id}>
                    <TableCell>
                      <StatusBadge status={isActive ? "Actif" : "Historique"} />
                    </TableCell>
                    <TableCell className="font-medium">{tenantDisplayName(rental)}</TableCell>
                    <TableCell>
                      <Link href={`/bien/${property.id}`} className="hover:underline">
                        {formatStreetAddress(property)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatCityInfo(property)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateFr(rental.entry_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{rental.tenant_email || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{rental.tenant_phone || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
