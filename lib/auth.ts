import { supabase } from "@/lib/supabase";

export async function getSessionUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Authentification requise.");
  }
  return user.id;
}

export async function getUserIdOrNull(): Promise<string | null> {
  const user = await getSessionUser();
  return user?.id ?? null;
}
