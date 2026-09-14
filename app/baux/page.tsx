"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ErrorNotice } from "@/components/ui/ErrorNotice";
import { fetchDocuments } from "@/lib/documents";
import { toErrorMessage } from "@/lib/errors";
import { fetchProperties } from "@/lib/properties";
import { formatDateFr, formatStreetAddress } from "@/lib/format";
import type { DocumentRecord, Property } from "@/lib/types";

export default function BauxPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchProperties(), fetchDocuments()])
      .then(([nextProperties, nextDocuments]) => {
        setProperties(nextProperties);
        setDocuments(nextDocuments);
      })
      .catch((err) => setError(toErrorMessage(err, "Impossible de charger les baux.")));
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

  return (
    <main className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Baux</h1>
        <p className="text-sm text-muted-foreground">Contrats de location générés</p>
      </div>
      {error && <ErrorNotice message={error} />}
      <Card>
        <CardHeader>
          <CardTitle>{leases.length} document{leases.length > 1 ? "s" : ""}</CardTitle>
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
    </main>
  );
}
