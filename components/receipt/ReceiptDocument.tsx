import { apartmentDetails, formatCityInfo, formatDateFr, formatEuro, formatStreetAddress, formatTenantAddress, tenantDisplayName } from "@/lib/format";
import { formatOwnerAddress, ownerField, ownerLegalName } from "@/lib/owners";
import { formatPeriodLabel, receiptAmounts } from "@/lib/receipts";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

export function ReceiptDocument({
  bien,
  tenant,
  owner,
  period,
  issuedAt,
}: {
  bien: Property;
  tenant: Rental;
  owner: OwnerProfile | null;
  period: string;
  issuedAt?: string | null;
}) {
  const amounts = receiptAmounts(bien);
  const extra = apartmentDetails(bien);
  const ownerName = ownerLegalName(owner) === "Non renseigné" ? "Le bailleur" : ownerLegalName(owner);
  const periodLabel = formatPeriodLabel(period);
  const tenantAddress = formatTenantAddress(tenant);

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-xl bg-white p-8 text-sm leading-relaxed text-slate-800 shadow-lg print:max-w-none print:p-0 print:shadow-none sm:p-12">
      <header className="mb-6 border-b pb-4 text-center">
        <h1 className="text-2xl font-bold tracking-wide text-slate-900 uppercase">Quittance de loyer</h1>
        <p className="mt-1 text-xs text-slate-500">Établie conformément à l&apos;article 21 de la loi n° 89-462 du 6 juillet 1989</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded border bg-slate-50 p-3 print:bg-transparent">
          <p className="font-semibold text-slate-900">Bailleur</p>
          <p>{ownerLegalName(owner)}</p>
          <p>{formatOwnerAddress(owner)}</p>
          <p>{ownerField(owner?.email)}</p>
          <p>{ownerField(owner?.phone)}</p>
        </div>
        <div className="rounded border bg-slate-50 p-3 print:bg-transparent">
          <p className="font-semibold text-slate-900">Locataire(s)</p>
          <p className="font-bold">{tenantDisplayName(tenant)}</p>
          <p>{tenantAddress || "Adresse non renseignée"}</p>
          <p>{ownerField(tenant.tenant_email, "Email non renseigné")}</p>
          <p>{ownerField(tenant.tenant_phone, "Téléphone non renseigné")}</p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="border-b pb-1 text-base font-bold text-slate-900">Logement concerné</h2>
        <p className="font-semibold">{formatStreetAddress(bien)}</p>
        {extra.length > 0 && <p>{extra.join(" • ")}</p>}
        <p>{formatCityInfo(bien)}</p>
      </section>

      <section className="space-y-2">
        <h2 className="border-b pb-1 text-base font-bold text-slate-900">Période et montants</h2>
        <p>
          Période locative : <strong className="capitalize">{periodLabel}</strong>
        </p>
        <p>
          Loyer hors charges : <strong>{formatEuro(amounts.rent, 2)}</strong>
        </p>
        <p>
          Provision sur charges : <strong>{formatEuro(amounts.charges, 2)}</strong>
        </p>
        <p className="font-semibold">
          Total reçu : {formatEuro(amounts.total, 2)} ({amounts.totalWords})
        </p>
      </section>

      <section className="rounded border bg-slate-50 p-4 print:bg-transparent">
        <p>
          Je soussigné(e) <strong>{ownerName}</strong>, bailleur du logement désigné ci-dessus, reconnais avoir reçu
          de <strong>{tenantDisplayName(tenant)}</strong> la somme de <strong>{formatEuro(amounts.total, 2)}</strong>
          , soit <strong>{amounts.totalWords}</strong>, au titre du loyer et des charges pour la période de{" "}
          <strong className="capitalize">{periodLabel}</strong>.
        </p>
        <p className="mt-3 text-xs text-slate-600">
          Cette quittance annule tous les reçus qui auraient pu être établis précédemment pour la même période. Elle
          ne vaut pas renonciation aux droits du bailleur pour les sommes restant dues.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-8 pt-6 text-center">
        <div>
          <p className="font-semibold">Fait le {formatDateFr(issuedAt) || formatDateFr(new Date().toISOString())}</p>
          <p className="mt-2 text-xs italic">Signature du bailleur</p>
          <div className="mt-2 h-20 rounded border" />
        </div>
        <div>
          <p className="font-semibold">Cachet éventuel</p>
          <div className="mt-8 h-20 rounded border" />
        </div>
      </section>
    </div>
  );
}
