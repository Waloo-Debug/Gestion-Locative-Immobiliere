import { formatStreetAddress } from "@/lib/format";
import { currentPeriod, tenantWasPresentInPeriod } from "@/lib/receipts";
import { fetchProperties } from "@/lib/properties";
import { getActiveTenants } from "@/lib/rentals";
import { supabase } from "@/lib/supabase";
import type { Property, Rental, RentPayment } from "@/lib/types";

export type RentPaymentRow = RentPayment & {
  property?: Property | null;
  rental?: Rental | null;
};

export function rentDueDayOf(rental: Rental | null | undefined) {
  const day = Number(rental?.rent_due_day);
  return day >= 1 && day <= 28 ? day : 5;
}

/** Prochaine date de virement (calendrier Europe/Paris). */
export function nextRentDueDate(rental: Rental | null | undefined, now = new Date()): Date {
  const dueDay = rentDueDayOf(rental);
  const paris = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(paris.find((p) => p.type === "year")?.value);
  const month = Number(paris.find((p) => p.type === "month")?.value);
  const day = Number(paris.find((p) => p.type === "day")?.value);

  let dueYear = year;
  let dueMonth = month;
  if (day > dueDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }
  return new Date(dueYear, dueMonth - 1, dueDay);
}

export function formatNextRentDueDate(rental: Rental | null | undefined, now = new Date()) {
  return nextRentDueDate(rental, now).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function propertyLabelOf(property: Property) {
  return `${formatStreetAddress(property)} — ${property.city}`.trim();
}

export async function ensureCurrentPeriodPayments(period = currentPeriod()) {
  const properties = await fetchProperties();
  const tenants = getActiveTenants(properties).filter(({ rental }) =>
    tenantWasPresentInPeriod(rental, period),
  );

  for (const { property, rental } of tenants) {
    const { data: existing } = await supabase
      .from("rent_payments")
      .select("id")
      .eq("rental_id", rental.id)
      .eq("period", period)
      .maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from("rent_payments").insert([
      {
        property_id: property.id,
        rental_id: rental.id,
        period,
        status: "pending",
      },
    ]);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }
  }
}

export async function listRentPaymentPeriods(propertyId?: string | null): Promise<string[]> {
  await ensureCurrentPeriodPayments(currentPeriod());

  let query = supabase.from("rent_payments").select("period");
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const unique = [...new Set(((data as { period: string }[]) || []).map((row) => row.period).filter(Boolean))];
  return unique.sort((a, b) => b.localeCompare(a));
}

export type ListRentPaymentsOptions = {
  /** `all` ou vide = toutes les périodes */
  period?: string | null;
  /** vide = tous les biens */
  propertyId?: string | null;
};

export async function listRentPayments(options: ListRentPaymentsOptions = {}): Promise<RentPaymentRow[]> {
  const period = options.period?.trim() || "all";
  const propertyId = options.propertyId?.trim() || "";

  if (period === currentPeriod() || period === "all") {
    await ensureCurrentPeriodPayments(currentPeriod());
  }

  const properties = await fetchProperties();
  const byProperty = new Map(properties.map((p) => [p.id, p]));
  const byRental = new Map<string, Rental>();
  for (const property of properties) {
    for (const rental of property.rentals || []) {
      byRental.set(rental.id, rental);
    }
  }

  let query = supabase.from("rent_payments").select("*").order("period", { ascending: false }).order("created_at", { ascending: false });
  if (period !== "all") query = query.eq("period", period);
  if (propertyId) query = query.eq("property_id", propertyId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data as RentPayment[]) || []).map((row) => ({
    ...row,
    property: byProperty.get(row.property_id) ?? null,
    rental: byRental.get(row.rental_id) ?? null,
  }));
}

export async function listRentPaymentsForPeriod(period = currentPeriod()): Promise<RentPaymentRow[]> {
  return listRentPayments({ period });
}

export async function listPendingRentPayments(period = currentPeriod()) {
  const rows = await listRentPayments({ period });
  return rows.filter((row) => row.status === "pending");
}

export async function confirmRentPaymentRequest(paymentId: string) {
  const response = await fetch("/api/rent-payments/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Confirmation impossible.");
  }
}

export async function resendQuittanceRequest(paymentId: string) {
  const response = await fetch("/api/rent-payments/resend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId }),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "Renvoi impossible.");
  }
}
