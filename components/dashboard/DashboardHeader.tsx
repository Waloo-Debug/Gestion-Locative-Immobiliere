import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Biens</h1>
        <p className="text-sm text-muted-foreground">Suivi et gestion de votre parc immobilier</p>
      </div>
      <Button onClick={onAdd}>
        <Plus data-icon="inline-start" />
        Ajouter un bien
      </Button>
    </header>
  );
}
