"use client";

import { useParams } from "next/navigation";
import { MissingCostsTableCard } from "@/components/calculator/MissingCostsTableCard";
import { OwnerCostsForm } from "@/components/calculator/OwnerCostsForm";
import { ProfitabilityCharts } from "@/components/calculator/ProfitabilityCharts";
import { ProfitabilityKpis } from "@/components/calculator/ProfitabilityKpis";
import { ProfitabilityTable } from "@/components/calculator/ProfitabilityTable";
import { RentSimulatorSlider } from "@/components/calculator/RentSimulatorSlider";
import { BackButton } from "@/components/ui/BackButton";
import { usePropertyCalculator } from "@/hooks/usePropertyCalculator";
import { formatStreetAddress } from "@/lib/format";

export default function CalculateurBienPage() {
  const params = useParams();
  const id = params.id as string;
  const calculator = usePropertyCalculator(id);

  if (calculator.loading) {
    return <div className="p-8 text-center text-muted-foreground">Chargement du calculateur...</div>;
  }
  if (!calculator.property) {
    return <div className="p-8 text-center text-destructive">Bien introuvable.</div>;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <BackButton href="/calculateur" label="Retour au calculateur" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{formatStreetAddress(calculator.property)}</h1>
        <p className="text-sm text-muted-foreground">
          {calculator.property.city} · saisis tes dépenses pour obtenir le loyer qui couvre tes charges
        </p>
      </div>

      {calculator.missingTable && <MissingCostsTableCard />}
      {calculator.message && <p className="text-sm text-muted-foreground">{calculator.message}</p>}

      {calculator.summary && (
        <>
          <ProfitabilityKpis currentRent={calculator.simulatedRent} summary={calculator.summary} />
          <RentSimulatorSlider
            value={calculator.simulatedRent}
            storedRent={calculator.storedRent}
            breakEven={calculator.summary.breakEven}
            min={calculator.rentRange.min}
            max={calculator.rentRange.max}
            step={calculator.rentRange.step}
            touched={calculator.rentTouched}
            saving={calculator.savingRent}
            onChange={calculator.updateSimulatedRent}
            onReset={calculator.resetSimulatedRent}
            onSave={calculator.saveSimulatedRent}
          />
          <ProfitabilityCharts
            costSlices={calculator.costSlices}
            summary={calculator.summary}
            simulatedRent={calculator.simulatedRent}
          />
        </>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <OwnerCostsForm
          form={calculator.form}
          saving={calculator.saving}
          onChange={calculator.setField}
          onSubmit={calculator.save}
        />
        <ProfitabilityTable rows={calculator.projection} />
      </div>
    </main>
  );
}
