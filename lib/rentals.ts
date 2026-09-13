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

export async function createRental(propertyId: string, values: TenantFormValues) {
  return supabase.from("rentals").insert([toRentalPayload(propertyId, values)]);
}

export async function updateRental(rentalId: string, propertyId: string, values: TenantFormValues) {
  return supabase.from("rentals").update(toRentalPayload(propertyId, values)).eq("id", rentalId);
}

export async function archiveRental(rentalId: string) {
  return supabase.from("rentals").update({ is_active: false }).eq("id", rentalId);
}

export async function archiveRentalsForProperty(propertyId: string) {
  return supabase.from("rentals").update({ is_active: false }).eq("property_id", propertyId);
}

export async function reactivateLatestRentalForProperty(propertyId: string) {
  const { data, error } = await supabase
    .from("rentals")
    .select("id")
    .eq("property_id", propertyId)
    .order("entry_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const { error: updateError } = await supabase.from("rentals").update({ is_active: true }).eq("id", data.id);
  if (updateError) return null;
  return data.id;
}
