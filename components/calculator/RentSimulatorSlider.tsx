"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEuro } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RentSimulatorSlider({
  value,
  storedRent,
  breakEven,
  min,
  max,
  step,
  touched,
  saving,
  onChange,
  onReset,
  onSave,
}: {
  value: number;
  storedRent: number;
  breakEven: number;
  min: number;
  max: number;
  step: number;
  touched: boolean;
  saving?: boolean;
  onChange: (value: number) => void;
  onReset: () => void;
  onSave: () => void;
}) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const breakEvenPercent = max > min ? ((breakEven - min) / (max - min)) * 100 : 0;
  const storedPercent = max > min ? ((storedRent - min) / (max - min)) * 100 : 0;
  const canSave = Math.abs(value - storedRent) > 0.005;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Simulateur de loyer</CardTitle>
          <CardDescription>
            Fais glisser le curseur pour voir l&apos;impact sur la rentabilité, puis enregistre le loyer HC sur la fiche
            du bien.
          </CardDescription>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {touched && (
            <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={saving}>
              Réinitialiser
            </Button>
          )}
          <Button type="button" size="sm" onClick={onSave} disabled={!canSave || saving}>
            {saving ? "Enregistrement..." : "Enregistrer le loyer"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Loyer simulé HC</p>
            <p className="text-3xl font-semibold tracking-tight">{formatEuro(value, 0)}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>Actuel : {formatEuro(storedRent, 0)}</p>
            <p>Équilibre : {formatEuro(breakEven, 0)}</p>
          </div>
        </div>

        <div className="relative pt-5">
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 text-[10px] text-amber-400"
            style={{ left: `${Math.min(100, Math.max(0, breakEvenPercent))}%` }}
          >
            équilibre
          </div>
          <div
            className="pointer-events-none absolute top-0 h-full w-px bg-amber-400/70"
            style={{ left: `${Math.min(100, Math.max(0, breakEvenPercent))}%` }}
          />
          <div
            className="pointer-events-none absolute top-0 h-full w-px bg-sky-400/50"
            style={{ left: `${Math.min(100, Math.max(0, storedPercent))}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className={cn(
              "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground",
              "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground",
              "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground",
            )}
            style={{
              background: `linear-gradient(to right, oklch(0.7 0.15 145) 0%, oklch(0.7 0.15 145) ${percent}%, oklch(1 0 0 / 12%) ${percent}%, oklch(1 0 0 / 12%) 100%)`,
            }}
            aria-label="Loyer simulé hors charges"
          />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatEuro(min, 0)}</span>
            <span>{formatEuro(max, 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
