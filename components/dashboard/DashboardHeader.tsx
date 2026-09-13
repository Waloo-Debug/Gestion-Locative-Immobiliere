import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader({
  onEdit,
  onDelete,
  onAdd,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onAdd: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Biens</h1>
        <p className="text-sm text-muted-foreground">Suivi et gestion de votre parc immobilier</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onEdit}>
          <Pencil data-icon="inline-start" />
          Modifier
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          <Trash2 data-icon="inline-start" />
          Supprimer
        </Button>
        <Button onClick={onAdd}>
          <Plus data-icon="inline-start" />
          Ajouter un bien
        </Button>
      </div>
    </header>
  );
}
