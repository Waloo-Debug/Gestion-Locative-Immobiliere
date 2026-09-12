import { supabase } from '@/lib/supabase';
import type { OwnerProfile } from '../types';

/**
 * Profil du bailleur connecté (table `profiles`).
 * Retourne `null` tant qu'aucun utilisateur n'est authentifié.
 */
export async function getCurrentOwner(): Promise<OwnerProfile | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Impossible de charger le profil bailleur : ${error.message}`);
  }

  return (data as OwnerProfile) ?? null;
}
