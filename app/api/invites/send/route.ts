import { NextResponse } from "next/server";
import { sendCoownerInviteEmail, isMailConfigured } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";

function displayName(profile: { first_name?: string | null; last_name?: string | null } | null) {
  const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  return name || "Un gestionnaire";
}

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!isMailConfigured()) {
    return NextResponse.json(
      {
        error:
          "E-mail non configuré. Ajoute les variables SMTP_* (mêmes valeurs que le SMTP Auth dans Supabase).",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { inviteId?: string } | null;
  const inviteId = body?.inviteId?.trim();
  if (!inviteId) {
    return NextResponse.json({ error: "inviteId manquant." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: invite, error: inviteError } = await supabase
    .from("property_invites")
    .select("id, email, token, status, property_id, invited_by")
    .eq("id", inviteId)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: inviteError?.message || "Invitation introuvable." },
      { status: 404 },
    );
  }
  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Cette invitation n’est plus en attente." }, { status: 400 });
  }

  const [{ data: property, error: propertyError }, { data: profile }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, street_number, street_name, city, department")
      .eq("id", invite.property_id)
      .maybeSingle(),
    supabase.from("owner_profiles").select("first_name, last_name").eq("id", user.id).maybeSingle(),
  ]);

  if (propertyError) {
    return NextResponse.json({ error: propertyError.message }, { status: 403 });
  }
  if (!property) {
    return NextResponse.json({ error: "Bien introuvable ou accès refusé." }, { status: 403 });
  }

  const propertyLabel =
    [property.street_number, property.street_name, property.city, property.department]
      .filter(Boolean)
      .join(" ")
      .trim() || "un bien immobilier";

  const inviterName = displayName(profile);
  const inviteUrl = `${appOrigin(request)}/invitation?token=${invite.token}`;

  try {
    await sendCoownerInviteEmail({
      to: invite.email,
      inviterName,
      propertyLabel,
      inviteUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de l’envoi de l’e-mail.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
