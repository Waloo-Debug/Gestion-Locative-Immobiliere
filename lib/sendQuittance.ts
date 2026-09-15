import type { SupabaseClient } from "@supabase/supabase-js";
import { formatEuro, formatCityInfo, formatStreetAddress, tenantDisplayName } from "@/lib/format";
import {
  isMailConfigured,
  sendQuittanceEmail,
  sendQuittanceSentOwnerEmail,
} from "@/lib/mail";
import { buildQuittancePdfBytes } from "@/lib/quittancePdf";
import { propertyLabelOf } from "@/lib/rentPayments";
import {
  buildQuittanceFileName,
  formatPeriodLabel,
  receiptAmounts,
} from "@/lib/receipts";
import { PROPERTY_FILES_BUCKET } from "@/lib/propertyDocuments";
import type {
  DocumentRecord,
  OwnerProfile,
  Property,
  ReminderChannel,
  Rental,
  RentPayment,
} from "@/lib/types";

/** Génération PDF + envoi SMTP + archivage — réservé aux Route Handlers. */
export async function sendQuittanceForPayment(params: {
  client: SupabaseClient;
  payment: RentPayment;
  property: Property;
  rental: Rental;
  userId: string;
  markPaid: boolean;
}) {
  const { client, payment, property, rental, userId, markPaid } = params;
  const { data: coownerRows } = await client
    .from("property_coowners")
    .select("user_id")
    .eq("property_id", property.id);

  const ownerIds = new Set<string>((coownerRows || []).map((r) => r.user_id as string));
  if (property.user_id) ownerIds.add(property.user_id);

  const { data: ownerRows } = ownerIds.size
    ? await client.from("owner_profiles").select("*").in("id", [...ownerIds])
    : { data: [] as OwnerProfile[] };
  const owners = (ownerRows || []) as OwnerProfile[];

  const pdfBytes = await buildQuittancePdfBytes({
    bien: property,
    tenant: rental,
    owners,
    period: payment.period,
  });
  const fileName = buildQuittanceFileName(payment.period, rental.id);
  const storagePath = `${property.id}/Quittance/${crypto.randomUUID()}-${fileName}`;

  const { error: uploadError } = await client.storage
    .from(PROPERTY_FILES_BUCKET)
    .upload(storagePath, pdfBytes, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) {
    throw new Error(uploadError.message || "Échec de l’upload du PDF.");
  }

  let documentId = payment.quittance_document_id;
  if (!documentId) {
    const { data: doc, error: docError } = await client
      .from("documents")
      .insert([
        {
          property_id: property.id,
          rental_id: rental.id,
          file_name: fileName,
          document_type: "Quittance",
          user_id: userId,
          storage_path: storagePath,
          mime_type: "application/pdf",
          file_size: pdfBytes.byteLength,
        },
      ])
      .select("*")
      .maybeSingle();
    if (docError || !doc) {
      throw new Error(docError?.message || "Impossible d’enregistrer la quittance.");
    }
    documentId = (doc as DocumentRecord).id;
  } else {
    await client
      .from("documents")
      .update({
        storage_path: storagePath,
        mime_type: "application/pdf",
        file_size: pdfBytes.byteLength,
        file_name: fileName,
      })
      .eq("id", documentId);
  }

  const amounts = receiptAmounts(property);
  const tenantEmail = rental.tenant_email?.trim();
  if (!tenantEmail) {
    throw new Error("Le locataire n’a pas d’e-mail : impossible d’envoyer la quittance.");
  }

  const propertyLabel = propertyLabelOf(property);
  const tenantName = tenantDisplayName(rental);
  const periodLabel = formatPeriodLabel(payment.period);
  const amountLabel = formatEuro(amounts.total);

  await sendQuittanceEmail({
    to: tenantEmail,
    tenantName,
    propertyLabel,
    periodLabel,
    amountLabel,
    pdfBytes,
    pdfFileName: fileName,
  });

  const patch: Record<string, unknown> = {
    quittance_document_id: documentId,
    quittance_sent_at: new Date().toISOString(),
  };
  if (markPaid) {
    patch.status = "paid";
    patch.paid_at = new Date().toISOString();
    patch.paid_by = userId;
  }

  const { error } = await client.from("rent_payments").update(patch).eq("id", payment.id);
  if (error) throw new Error(error.message);

  // Accusé d’envoi aux détenteurs selon leur canal (e-mail / in-app / aucun).
  await notifyOwnersQuittanceSent({
    client,
    owners,
    paymentId: payment.id,
    property,
    propertyLabel,
    tenantName,
    periodLabel,
    amountLabel,
    tenantEmail,
  });
}

async function notifyOwnersQuittanceSent(params: {
  client: SupabaseClient;
  owners: OwnerProfile[];
  paymentId: string;
  property: Property;
  propertyLabel: string;
  tenantName: string;
  periodLabel: string;
  amountLabel: string;
  tenantEmail: string;
}) {
  const {
    client,
    owners,
    paymentId,
    property,
    propertyLabel,
    tenantName,
    periodLabel,
    amountLabel,
    tenantEmail,
  } = params;

  const propertyShortLabel = `${formatStreetAddress(property)}, ${formatCityInfo(property)}`;

  for (const profile of owners) {
    const channel = (profile.reminder_channel || "email") as ReminderChannel;
    if (channel === "none") continue;

    if (channel === "in_app") {
      await client.from("notifications").insert([
        {
          user_id: profile.id,
          property_id: property.id,
          rent_payment_id: paymentId,
          title: "Quittance envoyée",
          body: propertyShortLabel,
        },
      ]);
      continue;
    }

    if (channel === "email" && profile.email && isMailConfigured()) {
      try {
        await sendQuittanceSentOwnerEmail({
          to: profile.email,
          propertyLabel,
          tenantName,
          periodLabel,
          amountLabel,
          tenantEmail,
        });
      } catch {
        // L’envoi locataire a déjà réussi : ne pas faire échouer la confirmation.
      }
    }
  }
}
