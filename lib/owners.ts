import { supabase } from "./supabase";
import type { OwnerProfile, OwnerProfileFormValues } from "./types";

export const OWNER_PROFILE_ID = "default";
const LOCAL_PROFILE_KEY = "locagest-owner-profile";

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
  extras?: Partial<OwnerProfile>,
): OwnerProfile {
  const streetNumber = form.streetNumber.trim() || null;
  const streetName = form.streetName.trim() || null;
  const city = form.city.trim() || null;
  const postalCode = form.postalCode.trim() || null;
  return {
    id: OWNER_PROFILE_ID,
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
  };
}

export function ownerDisplayName(profile: OwnerProfile | null | undefined) {
  const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  return name || "Gestionnaire";
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

function profileHasIdentity(profile: OwnerProfile | null | undefined) {
  if (!profile) return false;
  return Boolean(
    profile.first_name ||
      profile.last_name ||
      profile.email ||
      profile.phone ||
      profile.street_name ||
      profile.city ||
      profile.address,
  );
}

function readLocalProfile(): OwnerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OwnerProfile;
  } catch {
    return null;
  }
}

function writeLocalProfile(profile: OwnerProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

function normalizeProfile(row: Partial<OwnerProfile> | null | undefined): OwnerProfile | null {
  if (!row) return null;
  return {
    id: row.id || OWNER_PROFILE_ID,
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
  };
}

async function fetchAuthProfile(): Promise<OwnerProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return normalizeProfile(data as OwnerProfile | null);
}

async function fetchSingletonProfile(): Promise<{ profile: OwnerProfile | null; missingTable: boolean }> {
  const { data, error } = await supabase
    .from("owner_profiles")
    .select("*")
    .eq("id", OWNER_PROFILE_ID)
    .maybeSingle();

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

export async function fetchOwnerProfile(): Promise<OwnerProfile | null> {
  const authProfile = await fetchAuthProfile();
  if (profileHasIdentity(authProfile)) {
    writeLocalProfile(authProfile!);
    return authProfile;
  }

  const { profile } = await fetchSingletonProfile();
  if (profile) {
    writeLocalProfile(profile);
    return profile;
  }

  return readLocalProfile() || authProfile;
}

export async function fetchOwnerProfileState(): Promise<{
  profile: OwnerProfile | null;
  missingTable: boolean;
}> {
  const authProfile = await fetchAuthProfile();
  const singleton = await fetchSingletonProfile();
  const profile =
    (profileHasIdentity(singleton.profile) ? singleton.profile : null) ||
    (profileHasIdentity(authProfile) ? authProfile : null) ||
    singleton.profile ||
    authProfile ||
    readLocalProfile();

  if (profile) writeLocalProfile(profile);
  return { profile, missingTable: singleton.missingTable };
}

export async function upsertOwnerProfile(
  form: OwnerProfileFormValues,
  options?: { quittanceGenerationDay?: number | null },
) {
  const current = await fetchOwnerProfile();
  const next = formToOwnerProfile(form, {
    quittance_generation_day:
      options?.quittanceGenerationDay ?? current?.quittance_generation_day ?? null,
  });
  const payload = {
    ...next,
    updated_at: new Date().toISOString(),
  };

  writeLocalProfile(next);

  const { error } = await supabase.from("owner_profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    const missingTable =
      error.code === "42P01" ||
      error.message?.toLowerCase().includes("does not exist") ||
      error.message?.toLowerCase().includes("schema cache") ||
      error.message?.toLowerCase().includes("could not find");
    return { data: next, error, missingTable };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          first_name: payload.first_name,
          last_name: payload.last_name,
          email: payload.email,
          phone: payload.phone,
          street_number: payload.street_number,
          street_name: payload.street_name,
          city: payload.city,
          postal_code: payload.postal_code,
          address: payload.address,
          quittance_generation_day: payload.quittance_generation_day,
        },
        { onConflict: "id" },
      );
    } catch {
      // La table profiles auth est optionnelle.
    }
  }

  return { data: next, error: null, missingTable: false };
}

export async function saveQuittanceGenerationDay(day: number) {
  const current = await fetchOwnerProfile();
  const form = ownerProfileToForm(current);
  const result = await upsertOwnerProfile(form, { quittanceGenerationDay: day });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ quittance_generation_day: day }).eq("id", user.id);
  }

  return { error: result.error };
}
