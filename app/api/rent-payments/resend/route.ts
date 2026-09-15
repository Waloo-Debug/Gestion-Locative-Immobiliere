import { NextResponse } from "next/server";
import { sendQuittanceForPayment } from "@/lib/sendQuittance";
import { createClient } from "@/lib/supabase/server";
import type { Property, Rental, RentPayment } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { paymentId?: string } | null;
  const paymentId = body?.paymentId?.trim();
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId manquant." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("rent_payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
  }
  if ((payment as RentPayment).status !== "paid") {
    return NextResponse.json({ error: "Confirme d’abord le paiement." }, { status: 400 });
  }

  const [{ data: property }, { data: rental }] = await Promise.all([
    supabase.from("properties").select("*, rentals(*)").eq("id", payment.property_id).maybeSingle(),
    supabase.from("rentals").select("*").eq("id", payment.rental_id).maybeSingle(),
  ]);

  if (!property || !rental) {
    return NextResponse.json({ error: "Bien ou locataire introuvable." }, { status: 404 });
  }

  try {
    await sendQuittanceForPayment({
      client: supabase,
      payment: payment as RentPayment,
      property: property as Property,
      rental: rental as Rental,
      userId: user.id,
      markPaid: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Échec du renvoi." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
