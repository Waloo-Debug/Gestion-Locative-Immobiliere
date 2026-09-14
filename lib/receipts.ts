import { fetchDocuments, insertQuittanceDocument } from "./documents";
import { amountToWordsFr } from "./amountToWords";
import { fetchOwnerProfile, saveQuittanceGenerationDay } from "./owners";
import { fetchProperties } from "./properties";
import { getActiveTenants } from "./rentals";
import type { DocumentRecord, OwnerProfile, Property, Rental } from "./types";

const LOCAL_DAY_KEY = "locagest.quittanceGenerationDay";
const DEFAULT_GENERATION_DAY = 5;

export function currentPeriod(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function recentPeriods(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return currentPeriod(date);
  });
}

export function formatPeriodLabel(period: string) {
  const [year, month] = period.split("-").map(Number);
  if (!year || !month) return period;
  return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export function periodEndDate(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month, 0);
}

export function buildQuittanceFileName(period: string, rentalId: string) {
  return `Quittance_${period}_${rentalId}.pdf`;
}

export function parseQuittanceFileName(fileName?: string | null) {
  if (!fileName) return null;
  const match = fileName.match(/^Quittance_(\d{4}-\d{2})_(.+)\.pdf$/);
  if (!match) return null;
  return { period: match[1], rentalId: match[2] };
}

export function quittanceHref(propertyId: string, rentalId: string, period: string) {
  const params = new URLSearchParams({ propertyId, rentalId, period });
  return `/quittances/document?${params.toString()}`;
}

export function tenantWasPresentInPeriod(rental: Rental, period: string) {
  const entry = rental.entry_date?.slice(0, 10);
  if (!entry) return true;
  const end = periodEndDate(period);
  const endStamp = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return entry <= endStamp;
}

export function uniqueQuittances(documents: DocumentRecord[]) {
  const seen = new Set<string>();
  return documents.filter((document) => {
    if (document.document_type !== "Quittance") return false;
    const parsed = parseQuittanceFileName(document.file_name);
    const key = `${document.rental_id || parsed?.rentalId || document.id}:${parsed?.period || document.file_name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function receiptAlreadyExists(documents: DocumentRecord[], rentalId: string, period: string) {
  return documents.some((document) => {
    if (document.document_type !== "Quittance") return false;
    if (document.rental_id && document.rental_id === rentalId) {
      return parseQuittanceFileName(document.file_name)?.period === period || document.file_name.includes(period);
    }
    const parsed = parseQuittanceFileName(document.file_name);
    return parsed?.rentalId === rentalId && parsed.period === period;
  });
}

export function getLocalGenerationDay() {
  if (typeof window === "undefined") return DEFAULT_GENERATION_DAY;
  const stored = Number(window.localStorage.getItem(LOCAL_DAY_KEY));
  return stored >= 1 && stored <= 28 ? stored : DEFAULT_GENERATION_DAY;
}

export function setLocalGenerationDay(day: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_DAY_KEY, String(day));
}

export async function loadGenerationDay(profile?: OwnerProfile | null) {
  const owner = profile === undefined ? await fetchOwnerProfile() : profile;
  const fromProfile = Number(owner?.quittance_generation_day);
  if (fromProfile >= 1 && fromProfile <= 28) {
    setLocalGenerationDay(fromProfile);
    return fromProfile;
  }
  return getLocalGenerationDay();
}

export async function persistGenerationDay(day: number) {
  const safeDay = Math.min(28, Math.max(1, Math.round(day)));
  setLocalGenerationDay(safeDay);
  await saveQuittanceGenerationDay(safeDay);
  return safeDay;
}

export function isGenerationDayReached(day: number, date = new Date()) {
  return date.getDate() >= day;
}

export function receiptAmounts(property: Property) {
  const rent = Number(property.base_rent_price || 0);
  const charges = Number(property.service_charges || 0);
  const total = rent + charges;
  return {
    rent,
    charges,
    total,
    totalWords: amountToWordsFr(total),
  };
}

type GenerateResult = { created: number; skipped: number; failed: number; eligible: number };

const generationLocks = new Map<string, Promise<GenerateResult>>();

export async function generateReceiptsForPeriod(period: string) {
  const existingLock = generationLocks.get(period);
  if (existingLock) return existingLock;

  const run = generateReceiptsForPeriodUnlocked(period).finally(() => {
    generationLocks.delete(period);
  });
  generationLocks.set(period, run);
  return run;
}

async function generateReceiptsForPeriodUnlocked(period: string): Promise<GenerateResult> {
  const [properties, documents] = await Promise.all([fetchProperties(), fetchDocuments()]);
  const tenants = getActiveTenants(properties).filter(({ rental }) => tenantWasPresentInPeriod(rental, period));
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const { rental, property } of tenants) {
    if (receiptAlreadyExists(documents, rental.id, period)) {
      skipped += 1;
      continue;
    }
    const fileName = buildQuittanceFileName(period, rental.id);
    const { error } = await insertQuittanceDocument(property.id, rental.id, fileName);
    if (error) {
      failed += 1;
      continue;
    }
    documents.push({
      id: fileName,
      property_id: property.id,
      rental_id: rental.id,
      file_name: fileName,
      document_type: "Quittance",
    });
    created += 1;
  }

  return { created, skipped, failed, eligible: tenants.length };
}

export async function autoGenerateCurrentMonthReceipts() {
  const day = await loadGenerationDay();
  if (!isGenerationDayReached(day)) {
    return { created: 0, skipped: 0, eligible: 0, ran: false };
  }
  const period = currentPeriod();
  const result = await generateReceiptsForPeriod(period);
  return { ...result, ran: true, period };
}
