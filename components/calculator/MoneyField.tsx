import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoHint } from "@/components/ui/InfoHint";

export function MoneyField({
  label,
  value,
  onChange,
  suffix = "€",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  hint?: { term: string; definition: string };
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {hint ? <InfoHint term={hint.term} definition={hint.definition} /> : null}
      </Label>
      <div className="relative">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-8"
        />
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      </div>
    </div>
  );
}
