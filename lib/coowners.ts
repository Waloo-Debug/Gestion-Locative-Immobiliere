import { getUserIdOrNull, requireUserId } from "./auth";
import { supabase } from "./supabase";
import type { OwnerProfile, PropertyInvite, PropertyCoowner } from "./types";

export async function listCoowners(propertyId: string): Promise<PropertyCoowner[]> {
  const { data: rows, error } = await supabase
    .from("property_coowners")
    .select("property_id, user_id, created_at")
    .eq("property_id", propertyId);
  if (error || !rows?.length) return [];

  const userIds = rows.map((row) => row.user_id as string);
  const { data: profiles } = await supabase.from("owner_profiles").select("*").in("id", userIds);
  const byId = new Map((profiles || []).map((p) => [p.id as string, p as OwnerProfile]));

  return rows.map((row) => ({
    property_id: row.property_id as string,
    user_id: row.user_id as string,
    created_at: row.created_at as string | undefined,
    profile: byId.get(row.user_id as string) ?? null,
  }));
}

export async function fetchOwnerProfilesForProperty(propertyId: string): Promise<OwnerProfile[]> {
  const coowners = await listCoowners(propertyId);
  return coowners.map((c) => c.profile).filter((p): p is OwnerProfile => Boolean(p));
}

export async function ensureCreatorCoowner(propertyId: string, userId: string) {
  return supabase.from("property_coowners").upsert(
    { property_id: propertyId, user_id: userId },
    { onConflict: "property_id,user_id" },
  );
}

export async function createPropertyInvite(propertyId: string, email: string) {
  const userId = await requireUserId();
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return { data: null, error: { message: "E-mail invalide." } };
  }

  // Révoquer d'anciennes invitations pending pour ce couple bien/email
  await supabase
    .from("property_invites")
    .update({ status: "revoked" })
    .eq("property_id", propertyId)
    .eq("email", normalized)
    .eq("status", "pending");

  const { data, error } = await supabase
    .from("property_invites")
    .insert([
      {
        property_id: propertyId,
        email: normalized,
        invited_by: userId,
        status: "pending",
      },
    ])
    .select("*")
    .maybeSingle();

  return { data: data as PropertyInvite | null, error };
}

export async function listPropertyInvites(propertyId: string): Promise<PropertyInvite[]> {
  const { data } = await supabase
    .from("property_invites")
    .select("*")
    .eq("property_id", propertyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data as PropertyInvite[]) || [];
}

export async function revokePropertyInvite(inviteId: string) {
  return supabase.from("property_invites").update({ status: "revoked" }).eq("id", inviteId);
}

export async function removeCoowner(propertyId: string, userId: string) {
  const me = await requireUserId();
  if (me === userId) {
    return { error: { message: "Tu ne peux pas te retirer toi-même de ce bien." } };
  }
  return supabase.from("property_coowners").delete().eq("property_id", propertyId).eq("user_id", userId);
}

export async function getInviteByToken(token: string) {
  const { data, error } = await supabase.rpc("get_invite_by_token", { p_token: token });
  if (error) return { data: null, error };
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row as InvitePreview | null, error: null };
}

export type InvitePreview = {
  id: string;
  property_id: string;
  email: string;
  status: string;
  property_label: string | null;
  ownership_type: string | null;
};

export async function acceptInviteByToken(token: string) {
  const { data, error } = await supabase.rpc("accept_property_invite", { p_token: token });
  return { propertyId: (data as string | null) ?? null, error };
}

export async function listMyPendingInvites(): Promise<PropertyInvite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];
  const { data } = await supabase
    .from("property_invites")
    .select("*")
    .eq("email", user.email.toLowerCase())
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data as PropertyInvite[]) || [];
}

export function inviteLink(token: string) {
  if (typeof window === "undefined") return `/invitation?token=${token}`;
  return `${window.location.origin}/invitation?token=${token}`;
}

export async function getAccessiblePropertyIds(): Promise<string[]> {
  const userId = await getUserIdOrNull();
  if (!userId) return [];

  const [{ data: owned }, { data: shared }] = await Promise.all([
    supabase.from("properties").select("id").eq("user_id", userId),
    supabase.from("property_coowners").select("property_id").eq("user_id", userId),
  ]);

  const ids = new Set<string>();
  for (const row of owned || []) ids.add(row.id as string);
  for (const row of shared || []) ids.add(row.property_id as string);
  return [...ids];
}
