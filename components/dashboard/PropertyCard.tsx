"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ownershipTypeLabel } from "@/lib/accountType";
import { formatCityInfo, formatDateFr, formatStreetAddress, tenantDisplayName } from "@/lib/format";
import { getActiveRental } from "@/lib/rentals";
import type { Property } from "@/lib/types";

export function PropertyCard({
  bien,
  onEdit,
  onDelete,
}: {
  bien: Property;
  onEdit: (bien: Property) => void;
  onDelete: (bien: Property) => void;
}) {
  const activeTenant = getActiveRental(bien);

  return (
    <Card className="relative h-full transition-colors hover:bg-muted/20">
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Actions du bien" />}
          >
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem
              onClick={(event) => {
                event.preventDefault();
                onEdit(bien);
              }}
            >
              <Pencil />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                onDelete(bien);
              }}
            >
              <Trash2 />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Link href={`/bien/${bien.id}`} className="block h-full">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pr-12">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{bien.property_type}</Badge>
            <Badge variant={bien.ownership_type === "entreprise" ? "default" : "secondary"}>
              {ownershipTypeLabel(bien.ownership_type)}
            </Badge>
          </div>
          <StatusBadge status={bien.status} />
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold">{formatStreetAddress(bien)}</h3>
          <p className="text-sm text-muted-foreground">{formatCityInfo(bien)}</p>
          {bien.ownership_type === "entreprise" && bien.siret && (
            <p className="mt-1 text-xs text-muted-foreground">SIRET {bien.siret}</p>
          )}
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
      </Link>
    </Card>
  );
}
