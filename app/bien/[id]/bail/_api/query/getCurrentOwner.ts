import { fetchOwnerProfile } from "@/lib/owners";
import type { OwnerProfile } from "../types";

/**
 * Profil du bailleur (table `owner_profiles`, avec secours local / profiles auth).
 */
export async function getCurrentOwner(): Promise<OwnerProfile | null> {
  const profile = await fetchOwnerProfile();
  if (!profile) return null;

  return {
    id: profile.id,
    first_name: profile.first_name ?? null,
    last_name: profile.last_name ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    street_number: profile.street_number ?? null,
    street_name: profile.street_name ?? null,
    city: profile.city ?? null,
    postal_code: profile.postal_code ?? null,
    address: profile.address ?? null,
  };
}
