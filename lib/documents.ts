import { supabase } from "./supabase";
import type { DocumentRecord } from "./types";

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
  return (data as DocumentRecord[]) || [];
}

export async function fetchDocumentsByProperty(propertyId: string): Promise<DocumentRecord[]> {
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  return (data as DocumentRecord[]) || [];
}

export async function insertBailDocument(propertyId: string, rentalId: string, fileName: string) {
  return supabase.from("documents").insert([
    {
      property_id: propertyId,
      rental_id: rentalId,
      file_name: fileName,
      document_type: "Bail",
    },
  ]);
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
