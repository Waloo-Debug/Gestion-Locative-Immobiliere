import { supabase } from "./supabase";
import type { PropertyOwnerCosts } from "./types";

export function isMissingOwnerCostsTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message || "").toLowerCase();
  return (
    error.code === "42P01" ||
    message.includes("does not exist") ||
    message.includes("schema cache") ||
    message.includes("could not find the table")
  );
}

export async function fetchAllOwnerCosts(): Promise<{ data: PropertyOwnerCosts[]; missingTable: boolean }> {
  const { data, error } = await supabase.from("property_owner_costs").select("*");
  if (isMissingOwnerCostsTable(error)) return { data: [], missingTable: true };
  return { data: (data as PropertyOwnerCosts[]) || [], missingTable: false };
}

export async function fetchOwnerCostsByProperty(
  propertyId: string,
): Promise<{ data: PropertyOwnerCosts | null; missingTable: boolean }> {
  const { data, error } = await supabase
    .from("property_owner_costs")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (isMissingOwnerCostsTable(error)) return { data: null, missingTable: true };
  return { data: (data as PropertyOwnerCosts) ?? null, missingTable: false };
}

export async function upsertOwnerCosts(payload: PropertyOwnerCosts) {
  const { id: _id, ...rest } = payload;
  return supabase.from("property_owner_costs").upsert(
    {
      ...rest,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "property_id" },
  );
}
