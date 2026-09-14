import type { PostgrestError } from "@supabase/supabase-js";

/** Code PostgREST renvoyé par `.single()` lorsqu'aucune ligne ne correspond. */
const NO_ROWS = "PGRST116";

/**
 * Échec d'un accès aux données, porteur d'un message affichable.
 * Distingue une vraie erreur (réseau, RLS, schéma) d'un résultat vide.
 */
export class DataError extends Error {
  readonly code: string | null;

  constructor(context: string, cause: PostgrestError) {
    super(`${context} : ${cause.message}`);
    this.name = "DataError";
    this.code = cause.code ?? null;
  }
}

type Result<T> = { data: T | null; error: PostgrestError | null };

/** Renvoie les données d'une requête, ou lève une `DataError` si elle a échoué. */
export function unwrap<T>(result: Result<T>, context: string): T | null {
  if (result.error) throw new DataError(context, result.error);
  return result.data;
}

/**
 * Variante pour `.single()` : une absence de ligne n'est pas une erreur,
 * elle se traduit par `null`.
 */
export function unwrapMaybe<T>(result: Result<T>, context: string): T | null {
  if (result.error) {
    if (result.error.code === NO_ROWS) return null;
    throw new DataError(context, result.error);
  }
  return result.data;
}

/** Lève si une écriture a échoué. À utiliser sur tout insert/update/delete. */
export function assertWritten(result: { error: PostgrestError | null }, context: string): void {
  if (result.error) throw new DataError(context, result.error);
}

/** Message affichable pour n'importe quelle exception remontée d'une requête. */
export function toErrorMessage(error: unknown, fallback = "Une erreur est survenue."): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
