export type OwnershipType = "personne_morale" | "entreprise";

/** @deprecated Use OwnershipType — kept as alias during transition */
export type OwnerAccountType = OwnershipType;

export const OWNERSHIP_TYPE_OPTIONS: { value: OwnershipType; label: string }[] = [
  { value: "personne_morale", label: "Personne morale" },
  { value: "entreprise", label: "Entreprise" },
];

/** @deprecated Use OWNERSHIP_TYPE_OPTIONS */
export const OWNER_ACCOUNT_TYPE_OPTIONS = OWNERSHIP_TYPE_OPTIONS;

export function ownershipTypeLabel(type: OwnershipType | null | undefined) {
  if (type === "entreprise") return "Entreprise";
  if (type === "personne_morale") return "Personne morale";
  return "Non renseigné";
}

/** @deprecated Use ownershipTypeLabel */
export function accountTypeLabel(type: OwnershipType | null | undefined) {
  return ownershipTypeLabel(type);
}

export function isOwnershipType(value: unknown): value is OwnershipType {
  return value === "personne_morale" || value === "entreprise";
}

/** @deprecated Use isOwnershipType */
export function isOwnerAccountType(value: unknown): value is OwnershipType {
  return isOwnershipType(value);
}

export function normalizeSiret(value: string) {
  return value.replace(/\s+/g, "");
}

export function isValidSiret(value: string) {
  return /^\d{14}$/.test(normalizeSiret(value));
}
