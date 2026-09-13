import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Loué: "bg-emerald-500/15 text-emerald-400",
  Vacant: "bg-amber-500/15 text-amber-400",
  Vendu: "bg-sky-500/15 text-sky-400",
  Payée: "bg-emerald-500/15 text-emerald-400",
  "En Attente": "bg-amber-500/15 text-amber-400",
  Retard: "bg-red-500/15 text-red-400",
  Émise: "bg-sky-500/15 text-sky-400",
  Actif: "bg-emerald-500/15 text-emerald-400",
  Historique: "bg-red-500/15 text-red-400",
};

export function StatusBadge({ status }: { status?: string | null }) {
  const value = status || "Vacant";
  return <Badge className={cn("font-medium", styles[value] || "bg-secondary text-muted-foreground")}>{value}</Badge>;
}
