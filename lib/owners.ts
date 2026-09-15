import { requireUserId, getUserIdOrNull } from "./auth";
import { supabase } from "./supabase";
import type { OwnerProfile, OwnerProfileFormValues, ReminderChannel } from "./types";

export const emptyOwnerProfileForm: OwnerProfileFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  streetNumber: "",
  streetName: "",
  city: "",
  postalCode: "",
};

function composeLegacyAddress(parts: {
  streetNumber?: string | null;
  streetName?: string | null;
  postalCode?: string | null;
  city?: string | null;
}) {
  const street = `${parts.streetNumber || ""} ${parts.streetName || ""}`.trim();
  const cityLine = `${parts.postalCode || ""} ${parts.city || ""}`.trim();
  return [street, cityLine].filter(Boolean).join(", ") || null;
}

export function ownerProfileToForm(profile: OwnerProfile | null): OwnerProfileFormValues {
  return {
    firstName: profile?.first_name || "",
    lastName: profile?.last_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    streetNumber: profile?.street_number || "",
    streetName: profile?.street_name || "",
    city: profile?.city || "",
    postalCode: profile?.postal_code || "",
  };
}

export function formToOwnerProfile(
  form: OwnerProfileFormValues,
  userId: string,
  extras?: Partial<OwnerProfile>,
): OwnerProfile {
  const streetNumber = form.streetNumber.trim() || null;
  const streetName = form.streetName.trim() || null;
  const city = form.city.trim() || null;
  const postalCode = form.postalCode.trim() || null;
  return {
    id: userId,
    first_name: form.firstName.trim() || null,
    last_name: form.lastName.trim() || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    street_number: streetNumber,
    street_name: streetName,
    city,
    postal_code: postalCode,
    address: composeLegacyAddress({ streetNumber, streetName, postalCode, city }),
    quittance_generation_day: extras?.quittance_generation_day ?? null,
    reminder_channel: extras?.reminder_channel ?? "email",
  };
}

export function ownerDisplayName(profile: OwnerProfile | null | undefined) {
  const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  return name || "Gestionnaire";
}

export function isOwnerProfileComplete(profile: OwnerProfile | null | undefined) {
  if (!profile) return false;
  return Boolean(
    profile.first_name?.trim() &&
      profile.last_name?.trim() &&
      profile.email?.trim() &&
      profile.phone?.trim() &&
      profile.street_number?.trim() &&
      profile.street_name?.trim() &&
      profile.postal_code?.trim() &&
      profile.city?.trim(),
  );
}

export function authMetadataFromForm(form: OwnerProfileFormValues) {
  return {
    contact_email: form.email.trim(),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    phone: form.phone.trim(),
    street_number: form.streetNumber.trim(),
    street_name: form.streetName.trim(),
    postal_code: form.postalCode.trim(),
    city: form.city.trim(),
  };
}

export function formFromAuthMetadata(
  meta: Record<string, unknown> | null | undefined,
  email?: string | null,
): OwnerProfileFormValues {
  const text = (key: string) => {
    const value = meta?.[key];
    return typeof value === "string" ? value : "";
  };
  return {
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: (text("contact_email") || email || "").trim(),
    phone: text("phone"),
    streetNumber: text("street_number"),
    streetName: text("street_name"),
    postalCode: text("postal_code"),
    city: text("city"),
  };
}

export function ownerLegalName(profile: OwnerProfile | null | undefined) {
  const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  return name || "Non renseigné";
}

export function ownerField(value: string | null | undefined, fallback = "Non renseigné") {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

export function formatOwnerAddress(profile: OwnerProfile | null | undefined) {
  const street = `${profile?.street_number || ""} ${profile?.street_name || ""}`.trim();
  const cityLine = `${profile?.postal_code || ""} ${profile?.city || ""}`.trim();
  const composed = [street, cityLine].filter(Boolean).join(", ");
  if (composed) return composed;
  return ownerField(profile?.address);
}

export function ownerInitials(profile: OwnerProfile | null | undefined) {
  const first = profile?.first_name?.trim()?.[0] || "";
  const last = profile?.last_name?.trim()?.[0] || "";
  const initials = `${first}${last}`.toUpperCase();
  return initials || "GE";
}

function normalizeProfile(row: Partial<OwnerProfile> | null | undefined): OwnerProfile | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    account_type: row.account_type ?? null,
    siret: row.siret ?? null,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    email: row.email ?? null,
    phone: row.phone ?? null,
    street_number: row.street_number ?? null,
    street_name: row.street_name ?? null,
    city: row.city ?? null,
    postal_code: row.postal_code ?? null,
    address: row.address ?? null,
    quittance_generation_day: row.quittance_generation_day ?? null,
    reminder_channel: row.reminder_channel ?? "email",
  };
}

export async function fetchOwnerProfile(): Promise<OwnerProfile | null> {
  const userId = await getUserIdOrNull();
  if (!userId) return null;

  const { data, error } = await supabase.from("owner_profiles").select("*").eq("id", userId).maybeSingle();
  if (error || !data) return null;
  return normalizeProfile(data as OwnerProfile);
}

export async function fetchOwnerProfileState(): Promise<{
  profile: OwnerProfile | null;
  missingTable: boolean;
}> {
  const userId = await getUserIdOrNull();
  if (!userId) return { profile: null, missingTable: false };

  const { data, error } = await supabase.from("owner_profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    const missingTable =
      error.code === "42P01" ||
      error.message?.toLowerCase().includes("does not exist") ||
      error.message?.toLowerCase().includes("schema cache") ||
      error.message?.toLowerCase().includes("could not find");
    return { profile: null, missingTable };
  }
  return { profile: normalizeProfile(data as OwnerProfile | null), missingTable: false };
}

export async function upsertOwnerProfile(
  form: OwnerProfileFormValues,
  options?: {
    quittanceGenerationDay?: number | null;
    reminderChannel?: ReminderChannel | null;
  },
) {
  const userId = await requireUserId();
  const current = await fetchOwnerProfile();
  const next = formToOwnerProfile(form, userId, {
    quittance_generation_day:
      options?.quittanceGenerationDay ?? current?.quittance_generation_day ?? null,
    reminder_channel: options?.reminderChannel ?? current?.reminder_channel ?? "email",
  });
  const payload = {
    ...next,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("owner_profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    const missingTable =
      error.code === "42P01" ||
      error.message?.toLowerCase().includes("does not exist") ||
      error.message?.toLowerCase().includes("schema cache") ||
      error.message?.toLowerCase().includes("could not find");
    return { data: next, error, missingTable };
  }

  return { data: next, error: null, missingTable: false };
}

export async function ensureOwnerProfileFromAuth() {
  const userId = await getUserIdOrNull();
  if (!userId) return { profile: null as OwnerProfile | null, complete: false };

  const existing = await fetchOwnerProfile();
  if (isOwnerProfileComplete(existing)) {
    return { profile: existing, complete: true };
  }

  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user || user.id !== userId) {
    return { profile: existing, complete: isOwnerProfileComplete(existing) };
  }

  const fromMeta = formFromAuthMetadata(
    user.user_metadata as Record<string, unknown> | undefined,
    user.email,
  );
  const merged: OwnerProfileFormValues = {
    firstName: existing?.first_name || fromMeta.firstName,
    lastName: existing?.last_name || fromMeta.lastName,
    email: existing?.email || fromMeta.email || user.email || "",
    phone: existing?.phone || fromMeta.phone,
    streetNumber: existing?.street_number || fromMeta.streetNumber,
    streetName: existing?.street_name || fromMeta.streetName,
    city: existing?.city || fromMeta.city,
    postalCode: existing?.postal_code || fromMeta.postalCode,
  };

  const hasAny =
    merged.firstName ||
    merged.lastName ||
    merged.phone ||
    merged.streetNumber ||
    merged.streetName ||
    merged.city ||
    merged.postalCode;

  if (!hasAny && !merged.email) {
    return { profile: existing, complete: false };
  }

  const result = await upsertOwnerProfile(merged, {
    quittanceGenerationDay: existing?.quittance_generation_day ?? null,
    reminderChannel: existing?.reminder_channel ?? "email",
  });
  if (result.error && !result.missingTable) {
    return { profile: existing, complete: isOwnerProfileComplete(existing) };
  }
  return { profile: result.data, complete: isOwnerProfileComplete(result.data) };
}

export async function saveQuittanceGenerationDay(day: number) {
  const current = await fetchOwnerProfile();
  const form = ownerProfileToForm(current);
  const result = await upsertOwnerProfile(form, { quittanceGenerationDay: day });
  return { error: result.error };
}

export async function saveReminderChannel(channel: ReminderChannel) {
  const current = await fetchOwnerProfile();
  const form = ownerProfileToForm(current);
  const result = await upsertOwnerProfile(form, { reminderChannel: channel });
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
