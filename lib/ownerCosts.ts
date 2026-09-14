import { getUserIdOrNull, requireUserId } from "./auth";
import { getAccessiblePropertyIds } from "./coowners";
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
  const ids = await getAccessiblePropertyIds();
  if (!ids.length) return { data: [], missingTable: false };
  const { data, error } = await supabase.from("property_owner_costs").select("*").in("property_id", ids);
  if (isMissingOwnerCostsTable(error)) return { data: [], missingTable: true };
  return { data: (data as PropertyOwnerCosts[]) || [], missingTable: false };
}

export async function fetchOwnerCostsByProperty(
  propertyId: string,
): Promise<{ data: PropertyOwnerCosts | null; missingTable: boolean }> {
  const userId = await getUserIdOrNull();
  if (!userId) return { data: null, missingTable: false };
  const { data, error } = await supabase
    .from("property_owner_costs")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (isMissingOwnerCostsTable(error)) return { data: null, missingTable: true };
  return { data: (data as PropertyOwnerCosts) ?? null, missingTable: false };
}

export async function upsertOwnerCosts(payload: PropertyOwnerCosts) {
  const userId = await requireUserId();
  const { id: _id, ...rest } = payload;
  return supabase.from("property_owner_costs").upsert(
    {
      ...rest,
      user_id: userId,
      owner_id: userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "property_id" },
  );
}
