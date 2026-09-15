import { NextResponse } from "next/server";
import { formatEuro, formatCityInfo, formatStreetAddress, tenantDisplayName } from "@/lib/format";
import { isMailConfigured, sendRentReminderEmail } from "@/lib/mail";
import { currentPeriod, formatPeriodLabel, receiptAmounts, tenantWasPresentInPeriod } from "@/lib/receipts";
import { propertyLabelOf, rentDueDayOf } from "@/lib/rentPayments";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Property, ReminderChannel, Rental, RentPayment } from "@/lib/types";

function authorizeCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${secret}`;
}

/** Calendrier / heure en Europe/Paris (rappels à 18h françaises). */
function parisParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || "0");
  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  return {
    year,
    month,
    day,
    hour,
    dateStr: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    period: currentPeriod(new Date(year, month - 1, day)),
  };
}

export async function GET(request: Request) {
  return runReminders(request);
}

export async function POST(request: Request) {
  return runReminders(request);
}

async function runReminders(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { day, dateStr, period, hour } = parisParts();
  // Deux créneaux UTC (16h / 17h) pour couvrir CET et CEST ; on n’envoie qu’à 18h Paris.
  if (hour !== 18) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Hors 18h Europe/Paris", hour, period });
  }

  const admin = createAdminClient();

  const { data: activeRentals } = await admin.from("rentals").select("*").eq("is_active", true);

  for (const rental of (activeRentals as Rental[]) || []) {
    if (!rental.property_id) continue;
    if (!tenantWasPresentInPeriod(rental, period)) continue;

    const { data: property } = await admin
      .from("properties")
      .select("*")
      .eq("id", rental.property_id)
      .maybeSingle();
    if (!property || (property as Property).status !== "Loué") continue;

    await admin.from("rent_payments").upsert(
      [
        {
          property_id: rental.property_id,
          rental_id: rental.id,
          period,
          status: "pending",
        },
      ],
      { onConflict: "rental_id,period", ignoreDuplicates: true },
    );
  }

  const { data: pending, error } = await admin
    .from("rent_payments")
    .select("*")
    .eq("period", period)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let reminded = 0;
  let skipped = 0;

  for (const payment of (pending as RentPayment[]) || []) {
    const [{ data: rental }, { data: property }] = await Promise.all([
      admin.from("rentals").select("*").eq("id", payment.rental_id).maybeSingle(),
      admin.from("properties").select("*").eq("id", payment.property_id).maybeSingle(),
    ]);
    if (!rental || !property) {
      skipped += 1;
      continue;
    }

    const dueDay = rentDueDayOf(rental as Rental);
    if (day < dueDay) {
      skipped += 1;
      continue;
    }
    if (payment.last_reminded_on === dateStr) {
      skipped += 1;
      continue;
    }

    const { data: coownerRows } = await admin
      .from("property_coowners")
      .select("user_id")
      .eq("property_id", payment.property_id);

    const userIds = new Set<string>((coownerRows || []).map((r) => r.user_id as string));
    if ((property as Property).user_id) {
      userIds.add((property as Property).user_id as string);
    }

    const { data: profiles } = await admin
      .from("owner_profiles")
      .select("*")
      .in("id", [...userIds]);

    const amounts = receiptAmounts(property as Property);
    const payloadBase = {
      propertyLabel: propertyLabelOf(property as Property),
      tenantName: tenantDisplayName(rental as Rental),
      periodLabel: formatPeriodLabel(period),
      amountLabel: formatEuro(amounts.total),
    };

    for (const profile of profiles || []) {
      const channel = (profile.reminder_channel || "email") as ReminderChannel;
      if (channel === "none") continue;

      if (channel === "in_app") {
        await admin.from("notifications").insert([
          {
            user_id: profile.id,
            property_id: payment.property_id,
            rent_payment_id: payment.id,
            title: "Loyer à confirmer",
            body: `${formatStreetAddress(property as Property)}, ${formatCityInfo(property as Property)}`,
          },
        ]);
        continue;
      }

      if (channel === "email" && profile.email && isMailConfigured()) {
        try {
          await sendRentReminderEmail({ to: profile.email, ...payloadBase });
        } catch {
          // Continuer les autres destinataires
        }
      }
    }

    await admin.from("rent_payments").update({ last_reminded_on: dateStr }).eq("id", payment.id);
    reminded += 1;
  }

  return NextResponse.json({ ok: true, period, reminded, skipped });
}
