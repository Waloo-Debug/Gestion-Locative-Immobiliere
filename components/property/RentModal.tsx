"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyIrlIncrease } from "@/lib/format";
import type { IrlData } from "@/lib/types";

function rentWithIrlShare(baseRent: number, irlRate: number, sharePercent: number) {
  const effectiveRate = (irlRate * sharePercent) / 100;
  return applyIrlIncrease(baseRent, effectiveRate);
}

export function RentModal({
  open,
  irlData,
  isLoadingIrl,
  editRent,
  editCharges,
  onRentChange,
  onChargesChange,
  onSubmit,
  onCancel,
}: {
  open: boolean;
  irlData: IrlData | null;
  isLoadingIrl: boolean;
  editRent: string;
  editCharges: string;
  onRentChange: (value: string) => void;
  onChargesChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const [baseRent, setBaseRent] = useState(0);
  const [irlShare, setIrlShare] = useState(0);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setBaseRent(parseFloat(editRent) || 0);
      setIrlShare(0);
    }
    wasOpen.current = open;
  }, [open, editRent]);

  const effectiveRate = irlData ? (irlData.rate * irlShare) / 100 : 0;
  const previewRent =
    irlData && irlShare > 0 ? rentWithIrlShare(baseRent, irlData.rate, irlShare) : editRent;
  const sliderDisabled = !irlData || isLoadingIrl;

  function handleSliderChange(value: number) {
    setIrlShare(value);
    if (!irlData) return;
    onRentChange(rentWithIrlShare(baseRent, irlData.rate, value));
  }

  function handleRentInputChange(value: string) {
    setBaseRent(parseFloat(value) || 0);
    setIrlShare(0);
    onRentChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Modifier le loyer</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 rounded-lg bg-muted/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Indice IRL (INSEE)
            </span>
            {isLoadingIrl ? (
              <span className="text-xs text-muted-foreground">Recherche...</span>
            ) : irlData ? (
              <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold">
                {irlData.quarter} : +{irlData.rate}%
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Indisponible</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Faites glisser le curseur pour appliquer une part de l&apos;IRL au loyer de référence (
            {baseRent.toFixed(2)} €).
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-foreground">
                {irlShare}% de l&apos;IRL
                {irlData ? ` (+${effectiveRate.toFixed(2)}%)` : ""}
              </span>
              <span>100%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={irlShare}
              disabled={sliderDisabled}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pourcentage de l'IRL à appliquer"
            />
          </div>

          <div className="rounded-md border border-border/70 bg-background px-3 py-2">
            <p className="text-xs text-muted-foreground">Loyer après application</p>
            <p className="text-lg font-semibold tabular-nums tracking-tight">
              {Number(previewRent || 0).toFixed(2)} €
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Loyer de base (HC) en €</Label>
            <Input
              type="number"
              step="0.01"
              required
              value={editRent}
              onChange={(e) => handleRentInputChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Charges en €</Label>
            <Input
              type="number"
              step="0.01"
              value={editCharges}
              onChange={(e) => onChargesChange(e.target.value)}
            />
          </div>
          <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
