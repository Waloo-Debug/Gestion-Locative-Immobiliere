import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCityInfo, formatDateFr, formatStreetAddress, tenantDisplayName } from "@/lib/format";
import { getActiveRental } from "@/lib/rentals";
import type { Property } from "@/lib/types";

export function PropertyCard({ bien }: { bien: Property }) {
  const activeTenant = getActiveRental(bien);

  return (
    <Link href={`/bien/${bien.id}`} className="block">
      <Card className="h-full transition-colors hover:bg-muted/20">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <Badge variant="outline">{bien.property_type}</Badge>
          <StatusBadge status={bien.status} />
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold">{formatStreetAddress(bien)}</h3>
          <p className="text-sm text-muted-foreground">{formatCityInfo(bien)}</p>
          {activeTenant && (
            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">
              <p className="font-medium">{tenantDisplayName(activeTenant)}</p>
              <p className="text-muted-foreground">Bail débuté le {formatDateFr(activeTenant.entry_date)}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between text-sm">
          <span>
            Loyer HC <strong>{bien.base_rent_price} €</strong>
          </span>
          <span>
            Charges <strong>{bien.service_charges} €</strong>
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
