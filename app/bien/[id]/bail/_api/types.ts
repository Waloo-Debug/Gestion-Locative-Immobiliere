/**
 * Types du domaine « bail ».
 * Ils décrivent les colonnes Supabase consommées par la page de bail
 * (tables `properties`, `rentals`, `profiles`, `documents`).
 */

export type PropertyType = 'Appartement' | 'Maison';

export interface Rental {
  id: string;
  tenant_first_name: string;
  tenant_last_name: string;
  tenant2_first_name: string | null;
  tenant2_last_name: string | null;
  tenant_email: string | null;
  tenant_phone: string | null;
  entry_date: string;
  is_active?: boolean | null;
}

export interface Property {
  id: string;
  street_number: string | null;
  street_name: string | null;
  building_number: string | null;
  floor: string | null;
  apartment_number: string | null;
  city: string | null;
  department: string | null;
  property_type: PropertyType;
  base_rent_price: number | string | null;
  service_charges: number | string | null;
  status?: string | null;
}

export interface OwnerProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

/** Montants mensuels déjà normalisés en nombres, prêts à être affichés. */
export interface RentBreakdown {
  base: number;
  charges: number;
  total: number;
}

/**
 * Modèle de lecture de la page de bail : tout ce dont la vue a besoin,
 * déjà assemblé et normalisé par la couche query.
 */
export interface BailReadModel {
  property: Property;
  /** Locataire actif du bien, `null` si le bien n'en a aucun. */
  tenant: Rental | null;
  rent: RentBreakdown;
}

export type DocumentType = 'Bail' | 'Quittance';

export interface PropertyDocument {
  id: string;
  property_id: string;
  rental_id: string | null;
  file_name: string;
  document_type: DocumentType;
  created_at: string;
}
