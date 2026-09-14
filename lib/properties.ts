import { assertWritten, unwrap, unwrapMaybe } from "./errors";
import { supabase } from "./supabase";
import type { Property, PropertyFormValues } from "./types";

export function toPropertyPayload(values: PropertyFormValues) {
  return {
    street_number: values.streetNumber,
    street_name: values.streetName,
    apartment_number: values.propertyType === "Appartement" ? values.apartmentNumber : null,
    floor: values.propertyType === "Appartement" ? values.floor : null,
    building_number: values.propertyType === "Appartement" ? values.buildingNumber : null,
    city: values.city,
    department: values.department,
    property_type: values.propertyType,
  };
}

export async function fetchProperties(): Promise<Property[]> {
  const result = await supabase.from("properties").select("*, rentals(*)");
  return (unwrap(result, "Impossible de charger les biens") as Property[] | null) ?? [];
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const result = await supabase
    .from("properties")
    .select("*, rentals(*)")
    .eq("id", id)
    .single();
  return unwrapMaybe(result, "Impossible de charger le bien") as Property | null;
}

export async function createProperty(values: PropertyFormValues): Promise<void> {
  assertWritten(
    await supabase.from("properties").insert([toPropertyPayload(values)]),
    "Impossible d'ajouter le bien",
  );
}

export async function updateProperty(id: string, values: PropertyFormValues): Promise<void> {
  assertWritten(
    await supabase.from("properties").update(toPropertyPayload(values)).eq("id", id),
    "Impossible de modifier le bien",
  );
}

export async function deleteProperty(id: string): Promise<void> {
  assertWritten(
    await supabase.from("properties").delete().eq("id", id),
    "Impossible de supprimer le bien",
  );
}

export async function updatePropertyStatus(id: string, status: string): Promise<void> {
  assertWritten(
    await supabase.from("properties").update({ status }).eq("id", id),
    "Impossible de changer le statut du bien",
  );
}

export async function updatePropertyRent(
  id: string,
  baseRent: number,
  serviceCharges: number,
): Promise<void> {
  assertWritten(
    await supabase
      .from("properties")
      .update({ base_rent_price: baseRent, service_charges: serviceCharges })
      .eq("id", id),
    "Impossible d'enregistrer le loyer",
  );
}
