import type { Property, Rental } from "./types";

export function formatStreetAddress(bien: Pick<Property, "street_number" | "street_name">) {
  return `${bien.street_number || ""} ${bien.street_name}`.trim();
}

export function formatCityInfo(bien: Pick<Property, "city" | "department">) {
  return `${bien.city} (${bien.department})`;
}

export function formatDateFr(value?: string | null) {
  if (!value) return "";
  const dateOnly = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [year, month, day] = dateOnly.split("-");
    return `${day}/${month}/${year}`;
  }
  return new Date(value).toLocaleDateString("fr-FR");
}

export function formatMonthYear(value?: string | null) {
  if (!value) return "—";
  const dateOnly = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [year, month] = dateOnly.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }
  return new Date(value).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function formatEuro(value: number, fractionDigits = 0) {
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)} €`;
}

export function tenantDisplayName(tenant: Rental) {
  const primary = `${tenant.tenant_first_name} ${tenant.tenant_last_name}`.trim();
  if (!tenant.tenant2_first_name) return primary;
  return `${primary} & ${tenant.tenant2_first_name} ${tenant.tenant2_last_name}`;
}

export function formatTenantAddress(tenant: Pick<
  Rental,
  "tenant_street_number" | "tenant_street_name" | "tenant_postal_code" | "tenant_city"
>) {
  const street = `${tenant.tenant_street_number || ""} ${tenant.tenant_street_name || ""}`.trim();
  const cityLine = `${tenant.tenant_postal_code || ""} ${tenant.tenant_city || ""}`.trim();
  return [street, cityLine].filter(Boolean).join(", ");
}

export function apartmentDetails(bien: Property) {
  return [
    bien.building_number ? `Bât. ${bien.building_number}` : null,
    bien.floor ? `Étage ${bien.floor}` : null,
    bien.apartment_number ? `Apt ${bien.apartment_number}` : null,
  ].filter(Boolean) as string[];
}

export function monthlyRentTotal(baseRent: number | null, charges?: number | null) {
  return ((baseRent ?? 0) + (charges ?? 0)).toFixed(2);
}

export function applyIrlIncrease(currentRent: number, rate: number) {
  return (currentRent * (1 + rate / 100)).toFixed(2);
}

function fileNamePart(value: string | null | undefined, fallback: string) {
  const slug = (value ?? "").trim().replace(/\s+/g, "_");
  return slug || fallback;
}

export function buildBailFileName(bien: Property, tenant: Rental, issuedAt = new Date()) {
  const propertyName = fileNamePart(bien.street_name, "Logement");
  const tenantName = fileNamePart(`${tenant.tenant_first_name} ${tenant.tenant_last_name}`, "Locataire");
  const date = issuedAt.toISOString().split("T")[0];
  return `Bail_${propertyName}_${tenantName}_${date}.pdf`;
}
