import { NextResponse } from "next/server";
import { isMailConfigured, missingSmtpEnvKeys, sendCoownerInviteEmail } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";

function displayName(profile: { first_name?: string | null; last_name?: string | null } | null) {
  const name = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  return name || "Un gestionnaire";
}

function appOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "").trim();
  const looksLocal =
    !configured ||
    configured.includes("localhost") ||
    configured.includes("127.0.0.1");

  // En prod (Vercel), ne jamais renvoyer un lien localhost même si .env est mal réglé.
  if (configured && !looksLocal) return configured;

  const origin = request.headers.get("origin");
  if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    return origin.replace(/\/$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") || (looksLocal ? "http" : "https");
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return configured || "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!isMailConfigured()) {
    const missing = missingSmtpEnvKeys();
    return NextResponse.json(
      {
        error: `E-mail non configuré (manque : ${missing.join(", ") || "SMTP_*"}). En local : .env.local + redémarrage. Sur Vercel : Project Settings → Environment Variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NEXT_PUBLIC_APP_URL).`,
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
