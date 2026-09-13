import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateFr, formatTenantAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Property, Rental } from "@/lib/types";

const statuses = ["Vacant", "Loué", "Vendu"] as const;

export function CurrentRentalCard({
  bien,
  tenant,
  onStatusChange,
  onEditTenant,
}: {
  bien: Property;
  tenant: Rental | null;
  onStatusChange: (status: string) => void;
  onEditTenant: () => void;
}) {
  const tenantAddress = tenant ? formatTenantAddress(tenant) : "";

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Location actuelle</CardTitle>
        <div className="flex rounded-lg bg-muted p-1">
          {statuses.map((status) => {
            const isActive = bien.status === status || (status === "Vacant" && !bien.status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {status}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        {bien.status === "Loué" && tenant ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 p-4">
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Locataire(s)</p>
                <p className="font-medium">
                  {tenant.tenant_first_name} {tenant.tenant_last_name}
                </p>
                {tenant.tenant2_first_name && (
                  <p className="font-medium">
                    {tenant.tenant2_first_name} {tenant.tenant2_last_name}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">Entrée le</p>
                <p>{formatDateFr(tenant.entry_date)}</p>
              </div>
              <div className="col-span-2 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
                <p>{tenant.tenant_email || "Email non renseigné"}</p>
                <p>{tenant.tenant_phone || "Téléphone non renseigné"}</p>
                <p>{tenantAddress || "Adresse non renseignée"}</p>
              </div>
            </div>
            <Button variant="secondary" className="w-full" onClick={onEditTenant}>
              Modifier le locataire
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border py-8 text-center">
            <p className="mb-3 text-sm text-muted-foreground">Le bien n&apos;est actuellement pas loué.</p>
            {bien.status === "Loué" && (
              <Button onClick={onEditTenant}>Ajouter le locataire</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
