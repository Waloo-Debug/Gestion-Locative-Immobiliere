import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewLink } from "@/components/ui/ViewLink";
import { formatDateFr } from "@/lib/format";
import { parseQuittanceFileName, quittanceHref } from "@/lib/receipts";
import { cn } from "@/lib/utils";
import type { DocumentRecord } from "@/lib/types";

export function DocumentsSection({
  propertyId,
  bails,
  quittances,
}: {
  propertyId: string;
  bails: DocumentRecord[];
  quittances: DocumentRecord[];
}) {
  return (
    <div className="space-y-6 md:col-span-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Bail</CardTitle>
          <Link href={`/bien/${propertyId}/bail`} className={cn(buttonVariants({ size: "sm" }))}>
            Générer le bail
          </Link>
        </CardHeader>
        <CardContent>
          {bails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun bail généré pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {bails.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                  <div>
                    <span className="block text-sm font-medium">{doc.file_name}</span>
                    {doc.created_at && (
                      <span className="text-xs text-muted-foreground">Le {formatDateFr(doc.created_at)}</span>
                    )}
                  </div>
                  <ViewLink href={`/bien/${propertyId}/bail`} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historique des quittances</CardTitle>
          <Link href="/quittances" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Voir les quittances
          </Link>
        </CardHeader>
        <CardContent>
          {quittances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune quittance générée.</p>
          ) : (
            <ul className="space-y-2">
              {quittances.map((doc) => {
                const parsed = parseQuittanceFileName(doc.file_name);
                return (
                  <li key={doc.id} className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                    <div>
                      <span className="block text-sm font-medium">{doc.file_name}</span>
                      <span className="text-xs text-muted-foreground">{formatDateFr(doc.created_at)}</span>
                    </div>
                    {parsed ? (
                      <ViewLink href={quittanceHref(propertyId, parsed.rentalId, parsed.period)} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
