import { supabase } from "./supabase";
import { getUserIdOrNull, requireUserId } from "./auth";
import { ensureCreatorCoowner, getAccessiblePropertyIds } from "./coowners";
import { isValidSiret, normalizeSiret, type OwnershipType } from "./accountType";
import type { Property, PropertyFormValues } from "./types";

export function toPropertyPayload(values: PropertyFormValues) {
  const ownershipType: OwnershipType = values.ownershipType || "personne_morale";
  return {
    street_number: values.streetNumber,
    street_name: values.streetName,
    apartment_number: values.propertyType === "Appartement" ? values.apartmentNumber : null,
    floor: values.propertyType === "Appartement" ? values.floor : null,
    building_number: values.propertyType === "Appartement" ? values.buildingNumber : null,
    city: values.city,
    department: values.department,
    property_type: values.propertyType,
    ownership_type: ownershipType,
    siret: ownershipType === "entreprise" ? normalizeSiret(values.siret) : null,
  };
}

export function validatePropertyForm(values: PropertyFormValues): string | null {
  if (values.ownershipType === "entreprise" && !isValidSiret(values.siret)) {
    return "Le numéro de SIRET doit contenir exactement 14 chiffres.";
  }
  return null;
}

export async function fetchProperties(): Promise<Property[]> {
  const ids = await getAccessiblePropertyIds();
  if (!ids.length) return [];
  const { data, error } = await supabase.from("properties").select("*, rentals(*)").in("id", ids);
  if (error || !data) return [];
  return data as Property[];
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const userId = await getUserIdOrNull();
  if (!userId) return null;
  const { data } = await supabase.from("properties").select("*, rentals(*)").eq("id", id).maybeSingle();
  return (data as Property) ?? null;
}

export async function createProperty(values: PropertyFormValues) {
  const validationError = validatePropertyForm(values);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("properties")
    .insert([
      {
        ...toPropertyPayload(values),
        user_id: userId,
        base_rent_price: 0,
        service_charges: 0,
        status: "Vacant",
      },
    ])
    .select("id")
    .maybeSingle();
  if (error || !data?.id) return { data, error };
  await ensureCreatorCoowner(data.id as string, userId);
  return { data, error: null };
}

export async function updateProperty(id: string, values: PropertyFormValues) {
  const validationError = validatePropertyForm(values);
  if (validationError) {
    return { data: null, error: { message: validationError } };
  }
  await requireUserId();
  return supabase.from("properties").update(toPropertyPayload(values)).eq("id", id);
}

export async function deleteProperty(id: string) {
  await requireUserId();
  return supabase.from("properties").delete().eq("id", id);
}

export async function updatePropertyStatus(id: string, status: string) {
  await requireUserId();
  return supabase.from("properties").update({ status }).eq("id", id);
}

export async function updatePropertyRent(id: string, baseRent: number, serviceCharges: number) {
  await requireUserId();
  return supabase
    .from("properties")
    .update({
      base_rent_price: baseRent,
      service_charges: serviceCharges,
    })
    .eq("id", id);
}
