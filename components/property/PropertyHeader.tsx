import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apartmentDetails, formatStreetAddress } from "@/lib/format";
import type { Property } from "@/lib/types";

export function PropertyHeader({ bien, onEditRent }: { bien: Property; onEditRent: () => void }) {
  const extra = apartmentDetails(bien);

  return (
    <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Badge variant="outline" className="mb-2">
          {bien.property_type}
        </Badge>
        <h1 className="text-2xl font-semibold tracking-tight">{formatStreetAddress(bien)}</h1>
        {bien.property_type === "Appartement" && extra.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{extra.join(" • ")}</p>
        )}
        <p className="mt-0.5 text-sm text-muted-foreground">
          {bien.city} ({bien.department})
        </p>
      </div>
      <div className="text-left sm:text-right">
        <p className="mb-1 text-sm text-muted-foreground">Loyer mensuel</p>
        <div className="flex items-center gap-3 sm:justify-end">
          <Button variant="outline" size="sm" onClick={onEditRent}>
            Modifier le loyer
          </Button>
          <p className="text-2xl font-semibold">
            {bien.base_rent_price} €{" "}
            <span className="text-sm font-normal text-muted-foreground">+ {bien.service_charges}€ ch.</span>
          </p>
        </div>
      </div>
    </header>
  );
}
