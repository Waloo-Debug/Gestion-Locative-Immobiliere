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
  const { data, error } = await supabase.from("properties").select("*, rentals(*)");
  if (error || !data) return [];
  return data as Property[];
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const { data } = await supabase
    .from("properties")
    .select("*, rentals(*)")
    .eq("id", id)
    .single();
  return (data as Property) ?? null;
}

export async function createProperty(values: PropertyFormValues) {
  return supabase.from("properties").insert([toPropertyPayload(values)]);
}

export async function updateProperty(id: string, values: PropertyFormValues) {
  return supabase.from("properties").update(toPropertyPayload(values)).eq("id", id);
}

export async function deleteProperty(id: string) {
  return supabase.from("properties").delete().eq("id", id);
}

export async function updatePropertyStatus(id: string, status: string) {
  return supabase.from("properties").update({ status }).eq("id", id);
}

export async function updatePropertyRent(id: string, baseRent: number, serviceCharges: number) {
  return supabase.from("properties").update({
    base_rent_price: baseRent,
    service_charges: serviceCharges,
  }).eq("id", id);
}
