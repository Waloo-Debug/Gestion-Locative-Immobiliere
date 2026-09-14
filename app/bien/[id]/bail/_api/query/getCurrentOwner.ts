import { fetchOwnerProfilesForProperty } from "@/lib/coowners";
import type { OwnerProfile } from "../types";

/**
 * Profils de tous les co-détenteurs du bien (baux / quittances).
 */
export async function getPropertyOwners(propertyId: string): Promise<OwnerProfile[]> {
  const profiles = await fetchOwnerProfilesForProperty(propertyId);
  return profiles.map((profile) => ({
    id: profile.id,
    account_type: profile.account_type ?? null,
    siret: profile.siret ?? null,
    first_name: profile.first_name ?? null,
    last_name: profile.last_name ?? null,
    email: profile.email ?? null,
    phone: profile.phone ?? null,
    street_number: profile.street_number ?? null,
    street_name: profile.street_name ?? null,
    city: profile.city ?? null,
    postal_code: profile.postal_code ?? null,
    address: profile.address ?? null,
  }));
}

/** @deprecated Prefer getPropertyOwners */
export async function getCurrentOwner(): Promise<OwnerProfile | null> {
  return null;
}
