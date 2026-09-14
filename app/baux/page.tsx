"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PropertySelectModal } from "@/components/dashboard/PropertySelectModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ViewLink } from "@/components/ui/ViewLink";
import { fetchDocuments } from "@/lib/documents";
import { formatDateFr, formatStreetAddress } from "@/lib/format";
import { fetchProperties } from "@/lib/properties";
import { getActiveRental } from "@/lib/rentals";
import type { DocumentRecord, Property } from "@/lib/types";

export default function BauxPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchDocuments()]).then(([nextProperties, nextDocuments]) => {
      setProperties(nextProperties);
      setDocuments(nextDocuments);
    });
  }, []);

  const leases = useMemo(
    () =>
      documents
        .filter((document) => document.document_type === "Bail")
        .map((document) => ({
          ...document,
          property: properties.find((property) => property.id === document.property_id) ?? null,
        })),
    [documents, properties],
  );

  const rentableProperties = useMemo(
    () => properties.filter((property) => property.status === "Loué" && getActiveRental(property)),
    [properties],
  );

  function handleSelectProperty(property: Property) {
    setIsSelectOpen(false);
    router.push(`/bien/${property.id}/bail`);
  }

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Baux</h1>
          <p className="text-sm text-muted-foreground">Génération et historique des contrats de location</p>
        </div>
        <Button
          type="button"
          onClick={() => setIsSelectOpen(true)}
          disabled={rentableProperties.length === 0}
        >
          Générer un bail
        </Button>
      </div>

      {rentableProperties.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Aucun bien loué avec locataire actif : impossible de générer un bail pour le moment.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {leases.length} document{leases.length > 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leases.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun bail généré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Bien</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">{lease.file_name}</TableCell>
                    <TableCell>
                      {lease.property ? formatStreetAddress(lease.property) : "Bien inconnu"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateFr(lease.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {lease.property ? (
                        <ViewLink href={`/bien/${lease.property.id}/bail`} />
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PropertySelectModal
        open={isSelectOpen}
        title="Pour quel bien générer le bail ?"
        properties={rentableProperties}
        onSelect={handleSelectProperty}
        onCancel={() => setIsSelectOpen(false)}
      />
    </main>
  );
}
