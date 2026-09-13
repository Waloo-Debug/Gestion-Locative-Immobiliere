import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCityInfo, formatStreetAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Property } from "@/lib/types";

export function PropertySelectModal({
  open,
  title,
  properties,
  destructive,
  onSelect,
  onCancel,
}: {
  open: boolean;
  title: string;
  properties: Property[];
  destructive?: boolean;
  onSelect: (bien: Property) => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {properties.map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => onSelect(property)}
              className={cn(
                "w-full rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted",
                destructive && "hover:border-destructive/40 hover:bg-destructive/10",
              )}
            >
              <p className="font-medium">{formatStreetAddress(property)}</p>
              <p className="text-muted-foreground">{formatCityInfo(property)}</p>
            </button>
          ))}
        </div>
        <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
