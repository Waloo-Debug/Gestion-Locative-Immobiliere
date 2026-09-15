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

export function validateTenantForm(values: TenantFormValues): string | null {
  if (!values.t1FirstName.trim() || !values.t1LastName.trim()) {
    return "Le nom et le prénom du locataire sont obligatoires.";
  }
  if (!values.tEmail.trim()) {
    return "L’e-mail du locataire est obligatoire.";
  }
  if (!values.tEntryDate.trim()) {
    return "La date d’entrée est obligatoire.";
  }
  return null;
}

export function toRentalPayload(propertyId: string, values: TenantFormValues) {
  return {
    property_id: propertyId,
    tenant_first_name: values.t1FirstName.trim(),
    tenant_last_name: values.t1LastName.trim(),
    tenant2_first_name: values.t2FirstName.trim() || null,
    tenant2_last_name: values.t2LastName.trim() || null,
    tenant_email: values.tEmail.trim(),
    tenant_phone: values.tPhone.trim() || null,
    tenant_street_number: values.tStreetNumber.trim() || null,
    tenant_street_name: values.tStreetName.trim() || null,
    tenant_city: values.tCity.trim() || null,
    tenant_postal_code: values.tPostalCode.trim() || null,
    entry_date: values.tEntryDate.trim(),
    is_active: true,
    rent_due_day: (() => {
      const day = Number(values.rentDueDay);
      return day >= 1 && day <= 28 ? day : 5;
    })(),
  };
}

function isMissingColumnError(message: string) {
  const lower = message.toLowerCase();
  return lower.includes("schema cache") || lower.includes("could not find") || lower.includes("column");
}

/** Payload minimal si les colonnes d’adresse / is_active n’existent pas encore. */
function toMinimalRentalPayload(propertyId: string, values: TenantFormValues) {
  return {
    property_id: propertyId,
    tenant_first_name: values.t1FirstName.trim(),
    tenant_last_name: values.t1LastName.trim(),
    tenant2_first_name: values.t2FirstName.trim() || null,
    tenant2_last_name: values.t2LastName.trim() || null,
    tenant_email: values.tEmail.trim(),
    entry_date: values.tEntryDate.trim(),
  };
}

export async function createRental(propertyId: string, values: TenantFormValues) {
  const validationError = validateTenantForm(values);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const full = await supabase.from("rentals").insert([toRentalPayload(propertyId, values)]);
  if (!full.error) return full;

  if (isMissingColumnError(full.error.message || "")) {
    const fallback = await supabase.from("rentals").insert([toMinimalRentalPayload(propertyId, values)]);
    if (!fallback.error) {
      return {
        data: fallback.data,
        error: {
          message:
            "Locataire enregistré, mais certaines colonnes manquent en base. Exécute supabase/rentals_tenant_address.sql dans Supabase.",
        },
      };
    }
    return fallback;
  }

  return full;
}

export async function updateRental(rentalId: string, propertyId: string, values: TenantFormValues) {
  const validationError = validateTenantForm(values);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }

  const full = await supabase
    .from("rentals")
    .update(toRentalPayload(propertyId, values))
    .eq("id", rentalId);
  if (!full.error) return full;

  if (isMissingColumnError(full.error.message || "")) {
    return supabase.from("rentals").update(toMinimalRentalPayload(propertyId, values)).eq("id", rentalId);
  }

  return full;
}

export async function archiveRental(rentalId: string) {
  const result = await supabase.from("rentals").update({ is_active: false }).eq("id", rentalId);
  if (result.error && isMissingColumnError(result.error.message || "")) {
    return { data: null, error: null };
  }
  return result;
}

export async function archiveRentalsForProperty(propertyId: string) {
  const result = await supabase.from("rentals").update({ is_active: false }).eq("property_id", propertyId);
  if (result.error && isMissingColumnError(result.error.message || "")) {
    return { data: null, error: null };
  }
  return result;
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
  if (updateError) {
    if (isMissingColumnError(updateError.message || "")) return data.id;
    return null;
  }
  return data.id;
}
