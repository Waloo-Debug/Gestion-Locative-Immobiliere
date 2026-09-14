import { assertWritten, unwrapMaybe } from "./errors";
import { supabase } from "./supabase";
import type { Property, Rental, TenantFormValues } from "./types";

export function isRentalActive(rental: Rental) {
  return rental.is_active !== false;
}

export function getActiveRental(property: Property): Rental | null {
  return property.rentals?.find(isRentalActive) ?? null;
}

export function getActiveTenants(properties: Property[]) {
  return properties.flatMap((property) => {
    if (property.status !== "Loué") return [];
    return (property.rentals || []).filter(isRentalActive).map((rental) => ({ rental, property }));
  });
}

export function getAllTenants(properties: Property[]) {
  return properties.flatMap((property) =>
    (property.rentals || []).map((rental) => ({
      rental,
      property,
      isActive: property.status === "Loué" && isRentalActive(rental),
    })),
  );
}

export function toRentalPayload(propertyId: string, values: TenantFormValues) {
  return {
    property_id: propertyId,
    tenant_first_name: values.t1FirstName,
    tenant_last_name: values.t1LastName,
    tenant2_first_name: values.t2FirstName || null,
    tenant2_last_name: values.t2LastName || null,
    tenant_email: values.tEmail,
    tenant_phone: values.tPhone || null,
    tenant_street_number: values.tStreetNumber.trim() || null,
    tenant_street_name: values.tStreetName.trim() || null,
    tenant_city: values.tCity.trim() || null,
    tenant_postal_code: values.tPostalCode.trim() || null,
    entry_date: values.tEntryDate,
    is_active: true,
  };
}

export async function createRental(propertyId: string, values: TenantFormValues): Promise<void> {
  assertWritten(
    await supabase.from("rentals").insert([toRentalPayload(propertyId, values)]),
    "Impossible d'enregistrer le locataire",
  );
}

export async function updateRental(
  rentalId: string,
  propertyId: string,
  values: TenantFormValues,
): Promise<void> {
  assertWritten(
    await supabase.from("rentals").update(toRentalPayload(propertyId, values)).eq("id", rentalId),
    "Impossible de modifier le locataire",
  );
}

export async function archiveRental(rentalId: string): Promise<void> {
  assertWritten(
    await supabase.from("rentals").update({ is_active: false }).eq("id", rentalId),
    "Impossible d'archiver la location",
  );
}

export async function archiveRentalsForProperty(propertyId: string): Promise<void> {
  assertWritten(
    await supabase.from("rentals").update({ is_active: false }).eq("property_id", propertyId),
    "Impossible d'archiver les locations du bien",
  );
}

export async function reactivateLatestRentalForProperty(propertyId: string): Promise<string | null> {
  const latest = unwrapMaybe<{ id: string }>(
    await supabase
      .from("rentals")
      .select("id")
      .eq("property_id", propertyId)
      .order("entry_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "Impossible de retrouver la dernière location",
  );

  if (!latest) return null;

  assertWritten(
    await supabase.from("rentals").update({ is_active: true }).eq("id", latest.id),
    "Impossible de réactiver la location",
  );
  return latest.id;
}
