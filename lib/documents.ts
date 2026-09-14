import { assertWritten, unwrap } from "./errors";
import { supabase } from "./supabase";
import type { DocumentRecord } from "./types";

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const result = await supabase.from("documents").select("*").order("created_at", { ascending: false });
  return (unwrap(result, "Impossible de charger les documents") as DocumentRecord[] | null) ?? [];
}

export async function fetchDocumentsByProperty(propertyId: string): Promise<DocumentRecord[]> {
  const result = await supabase
    .from("documents")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  return (unwrap(result, "Impossible de charger les documents du bien") as DocumentRecord[] | null) ?? [];
}

export async function insertBailDocument(
  propertyId: string,
  rentalId: string,
  fileName: string,
): Promise<void> {
  assertWritten(
    await supabase.from("documents").insert([
      {
        property_id: propertyId,
        rental_id: rentalId,
        file_name: fileName,
        document_type: "Bail",
      },
    ]),
    "Impossible d'enregistrer le bail",
  );
}

export async function insertQuittanceDocument(propertyId: string, rentalId: string, fileName: string) {
  return supabase.from("documents").insert([
    {
      property_id: propertyId,
      rental_id: rentalId,
      file_name: fileName,
      document_type: "Quittance",
    },
  ]);
}
