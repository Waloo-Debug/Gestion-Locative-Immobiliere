import { formatDateFr, formatStreetAddress, formatTenantAddress, monthlyRentTotal } from "@/lib/format";
import { ownershipTypeLabel } from "@/lib/accountType";
import { formatOwnerAddress, ownerField, ownerLegalName } from "@/lib/owners";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

export function LeaseDocument({
  bien,
  tenant,
  owners,
  owner,
}: {
  bien: Property;
  tenant: Rental;
  owners?: OwnerProfile[];
  /** @deprecated Prefer owners */
  owner?: OwnerProfile | null;
}) {
  const tenantAddress = formatTenantAddress(tenant);
  const bailleurs = owners?.length ? owners : owner ? [owner] : [];

  return (
    <div
      id="lease-document"
      className="max-w-4xl mx-auto bg-white p-8 sm:p-12 shadow-lg rounded-xl print:shadow-none print:p-0 print:max-w-none text-slate-800 text-sm leading-relaxed space-y-6"
    >      <header className="text-center border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
          CONTRAT DE LOCATION D&apos;HABITATION
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Soumis au régime de la loi n° 89-462 du 6 juillet 1989 modifiée
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-bold border-b text-base text-slate-900 pb-1">I. DÉSIGNATION DES PARTIES</h2>

        <div className="bg-slate-50 p-3 rounded border print:bg-transparent print:border-none space-y-3">
          <p className="font-semibold text-slate-900">
            Le{bailleurs.length > 1 ? "s" : ""} Bailleur{bailleurs.length > 1 ? "s" : ""} / Propriétaire
            {bailleurs.length > 1 ? "s" : ""} :
          </p>
          <p className="text-xs text-slate-600">
            Détention : {ownershipTypeLabel(bien.ownership_type)}
            {bien.ownership_type === "entreprise" && bien.siret ? ` — SIRET ${bien.siret}` : ""}
          </p>
          {bailleurs.length === 0 ? (
            <p>Non renseigné</p>
          ) : (
            bailleurs.map((item) => (
              <div key={item.id} className="border-t border-slate-200 pt-2 first:border-t-0 first:pt-0">
                <p>{ownerLegalName(item)}</p>
                <p>Demeurant à : {formatOwnerAddress(item)}</p>
                <p>Téléphone : {ownerField(item.phone)}</p>
                <p>Email : {ownerField(item.email)}</p>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-50 p-3 rounded border print:bg-transparent print:border-none">
          <p className="font-semibold text-slate-900">Le(s) Locataire(s) :</p>
          <p className="font-bold">
            {tenant.tenant_first_name} {tenant.tenant_last_name}
          </p>
          {tenant.tenant2_first_name && (
            <p className="font-bold">
              {tenant.tenant2_first_name} {tenant.tenant2_last_name}
            </p>
          )}
          <p>Demeurant à : {tenantAddress || "Non renseigné"}</p>
          <p>Téléphone : {ownerField(tenant.tenant_phone)}</p>
          <p>Email : {ownerField(tenant.tenant_email)}</p>
        </div>
      </section>


      <section className="space-y-2">
        <h2 className="font-bold border-b text-base text-slate-900 pb-1">II. OBJET DU CONTRAT</h2>
        <p>Le bailleur donne en location au locataire le logement situé à l&apos;adresse suivante :</p>
        <div className="p-3 bg-slate-50 rounded border print:bg-transparent">
          <p className="font-semibold">{formatStreetAddress(bien)}</p>
          {bien.property_type === "Appartement" && (
            <p>
              {[
                bien.building_number ? `Bâtiment ${bien.building_number}` : null,
                bien.floor ? `Étage ${bien.floor}` : null,
                bien.apartment_number ? `Appartement ${bien.apartment_number}` : null,
              ]
                .filter(Boolean)
                .join(" - ")}
            </p>
          )}
          <p>
            {bien.city} ({bien.department})
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Type de bien : <strong>{bien.property_type}</strong>
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold border-b text-base text-slate-900 pb-1">III. CONDITIONS FINANCIÈRES</h2>
        <p>
          Le loyer mensuel hors charges est fixé à : <strong>{bien.base_rent_price} €</strong>.
        </p>
        <p>
          Montant de la provision mensuelle sur charges : <strong>{bien.service_charges || 0} €</strong>.
        </p>
        <p className="font-semibold">
          Loyer total mensuel charges comprises : {monthlyRentTotal(bien.base_rent_price, bien.service_charges)} €
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold border-b text-base text-slate-900 pb-1">IV. DATE DE PRISE D&apos;EFFET</h2>
        <p>
          Le présent contrat prend effet le : <strong>{formatDateFr(tenant.entry_date)}</strong>.
        </p>
      </section>

      <section className="pt-8 grid grid-cols-2 gap-8 text-center">
        <div>
          <p className="font-semibold">Fait à ........................, le ..................</p>
          <p className="mt-2 text-xs italic">Signature du (des) Bailleur(s)</p>
          <div className="h-20 border mt-2 rounded"></div>
        </div>
        <div>
          <p className="font-semibold">Signature du (des) Locataire(s)</p>
          <p className="mt-2 text-xs italic">(Précédée de la mention &quot;Lu et approuvé&quot;)</p>
          <div className="h-20 border mt-2 rounded"></div>
        </div>
      </section>
    </div>
  );
}
