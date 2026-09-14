import { NextResponse } from "next/server";
import { formFromAuthMetadata, formToOwnerProfile, isOwnerProfileComplete } from "@/lib/owners";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") || "/dashboard";
  const next = nextParam.startsWith("/") ? nextParam : "/dashboard";
  const authError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let complete = false;
      if (user) {
        const { data: existing } = await supabase
          .from("owner_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const fromMeta = formFromAuthMetadata(
          user.user_metadata as Record<string, unknown> | undefined,
          user.email,
        );
        const merged = {
          firstName: existing?.first_name || fromMeta.firstName,
          lastName: existing?.last_name || fromMeta.lastName,
          email: existing?.email || fromMeta.email || user.email || "",
          phone: existing?.phone || fromMeta.phone,
          streetNumber: existing?.street_number || fromMeta.streetNumber,
          streetName: existing?.street_name || fromMeta.streetName,
          city: existing?.city || fromMeta.city,
          postalCode: existing?.postal_code || fromMeta.postalCode,
        };

        const profile = formToOwnerProfile(merged, user.id, {
          quittance_generation_day: existing?.quittance_generation_day ?? null,
        });

        if (
          profile.first_name ||
          profile.last_name ||
          profile.phone ||
          profile.street_name ||
          profile.email
        ) {
          await supabase.from("owner_profiles").upsert(
            { ...profile, updated_at: new Date().toISOString() },
            { onConflict: "id" },
          );
        }

        complete = isOwnerProfileComplete({ ...existing, ...profile });
      }

      if (!complete && !next.includes("profil") && !next.includes("invitation")) {
        return NextResponse.redirect(`${origin}/profil?completer=1`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const redirect = new URL("/connexion", origin);
  redirect.searchParams.set("error", authError || "auth");
  if (errorDescription) {
    redirect.searchParams.set("details", errorDescription.slice(0, 200));
  }
  return NextResponse.redirect(redirect);
}
