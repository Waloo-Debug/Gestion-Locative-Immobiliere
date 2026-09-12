import { supabase } from '@/lib/supabase';
import type { Property, Rental } from '../types';

export interface SaveBailDocumentInput {
  property: Property;
  /** Locataire de l'époque : le document reste rattaché à cette location. */
  tenant: Rental;
  /** Date d'émission, injectable pour faciliter les tests. */
  issuedAt?: Date;
}

function slugify(value: string | null | undefined, fallback: string): string {
  const slug = (value ?? '').trim().replace(/\s+/g, '_');
  return slug.length > 0 ? slug : fallback;
}

/** `Bail_<Adresse>_<Locataire>_<AAAA-MM-JJ>.pdf` */
export function buildBailFileName({ property, tenant, issuedAt = new Date() }: SaveBailDocumentInput): string {
  const propertyName = slugify(property.street_name, 'Logement');
  const tenantName = slugify(`${tenant.tenant_first_name} ${tenant.tenant_last_name}`, 'Locataire');
  const date = issuedAt.toISOString().split('T')[0];

  return `Bail_${propertyName}_${tenantName}_${date}.pdf`;
}

/**
 * Trace le bail généré dans la table `documents`.
 * Retourne le nom de fichier enregistré.
 */
export async function saveBailDocument(input: SaveBailDocumentInput): Promise<string> {
  const fileName = buildBailFileName(input);

  const { error } = await supabase.from('documents').insert([
    {
      property_id: input.property.id,
      rental_id: input.tenant.id,
      file_name: fileName,
      document_type: 'Bail',
    },
  ]);

  if (error) {
    throw new Error(`Impossible d'enregistrer le bail : ${error.message}`);
  }

  return fileName;
}
