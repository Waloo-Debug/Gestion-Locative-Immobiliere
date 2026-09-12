import { supabase } from '@/lib/supabase';
import type { BailReadModel, Property, Rental, RentBreakdown } from '../types';

/** Convertit une valeur Supabase `numeric` (number | string | null) en nombre sûr. */
function toAmount(value: number | string | null | undefined): number {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(amount) ? (amount as number) : 0;
}

/** Le bail se rédige pour le locataire actif ; à défaut, pour le plus récemment enregistré. */
function selectCurrentTenant(rentals: Rental[]): Rental | null {
  if (rentals.length === 0) return null;
  return rentals.find((rental) => rental.is_active) ?? rentals[0];
}

function computeRent(property: Property): RentBreakdown {
  const base = toAmount(property.base_rent_price);
  const charges = toAmount(property.service_charges);
  return { base, charges, total: base + charges };
}

/**
 * Charge le bien, son locataire courant et les montants du loyer.
 * Retourne `null` si le bien n'existe pas.
 */
export async function getBailReadModel(propertyId: string): Promise<BailReadModel | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, rentals(*)')
    .eq('id', propertyId)
    .single();

  // PGRST116 = aucune ligne renvoyée par `.single()` : le bien n'existe pas.
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Impossible de charger le bien : ${error.message}`);
  }
  if (!data) return null;

  const { rentals = [], ...property } = data as Property & { rentals: Rental[] | null };

  return {
    property,
    tenant: selectCurrentTenant(rentals ?? []),
    rent: computeRent(property),
  };
}
