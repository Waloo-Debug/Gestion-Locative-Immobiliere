import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ownershipTypeLabel } from "@/lib/accountType";
import { apartmentDetails, formatCityInfo, formatEuro, formatStreetAddress, formatTenantAddress, tenantDisplayName } from "@/lib/format";
import { formatOwnerAddress, ownerField, ownerLegalName } from "@/lib/owners";
import { formatPeriodLabel, receiptAmounts } from "@/lib/receipts";
import type { OwnerProfile, Property, Rental } from "@/lib/types";

function linesForWidth(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function buildQuittancePdfBytes(input: {
  bien: Property;
  tenant: Rental;
  owners: OwnerProfile[];
  period: string;
  issuedAt?: string | null;
}): Promise<Uint8Array> {
  const { bien, tenant, owners, period, issuedAt } = input;
  const amounts = receiptAmounts(bien);
  const periodLabel = formatPeriodLabel(period);
  const extra = apartmentDetails(bien);
  const tenantAddress = formatTenantAddress(tenant) || "Adresse non renseignée";
  const issued =
    issuedAt?.slice(0, 10) ||
    new Date().toISOString().slice(0, 10);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  let y = 790;

  const draw = (text: string, opts?: { bold?: boolean; size?: number; indent?: number }) => {
    const size = opts?.size ?? 10;
    const used = opts?.bold ? fontBold : font;
    const indent = opts?.indent ?? 0;
    page.drawText(text, {
      x: margin + indent,
      y,
      size,
      font: used,
      color: rgb(0.12, 0.16, 0.22),
    });
    y -= size + 6;
  };

  const drawWrapped = (text: string, opts?: { bold?: boolean; size?: number }) => {
    for (const line of linesForWidth(text, 85)) {
      draw(line, opts);
    }
  };

  draw("QUITTANCE DE LOYER", { bold: true, size: 16 });
  draw("Établie conformément à l'article 21 de la loi n° 89-462 du 6 juillet 1989", { size: 8 });
  y -= 8;

  draw("Bailleur(s)", { bold: true, size: 12 });
  draw(
    `${ownershipTypeLabel(bien.ownership_type)}${
      bien.ownership_type === "entreprise" && bien.siret ? ` — SIRET ${bien.siret}` : ""
    }`,
    { size: 9 },
  );
  if (!owners.length) {
    draw("Non renseigné");
  } else {
    for (const owner of owners) {
      draw(ownerLegalName(owner), { bold: true });
      drawWrapped(formatOwnerAddress(owner) || "Adresse non renseignée");
      draw(ownerField(owner.email));
      draw(ownerField(owner.phone));
      y -= 4;
    }
  }

  y -= 6;
  draw("Locataire(s)", { bold: true, size: 12 });
  draw(tenantDisplayName(tenant), { bold: true });
  drawWrapped(tenantAddress);
  draw(ownerField(tenant.tenant_email, "Email non renseigné"));
  draw(ownerField(tenant.tenant_phone, "Téléphone non renseigné"));

  y -= 6;
  draw("Logement concerné", { bold: true, size: 12 });
  draw(formatStreetAddress(bien), { bold: true });
  if (extra.length) draw(extra.join(" • "));
  draw(formatCityInfo(bien));

  y -= 6;
  draw("Période et montants", { bold: true, size: 12 });
  draw(`Période locative : ${periodLabel}`);
  draw(`Loyer hors charges : ${formatEuro(amounts.rent)}`);
  draw(`Charges : ${formatEuro(amounts.charges)}`);
  draw(`Total : ${formatEuro(amounts.total)}`, { bold: true });
  drawWrapped(`Soit la somme de : ${amounts.totalWords}`);
  draw(`Date d'émission : ${issued}`);

  y -= 10;
  drawWrapped(
    "Le bailleur reconnaît avoir reçu la somme indiquée ci-dessus au titre du loyer et des charges pour la période considérée, et en donne quittance sous réserve de tous ses droits.",
  );

  return pdf.save();
}
