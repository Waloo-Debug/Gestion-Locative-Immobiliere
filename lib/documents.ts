import { getUserIdOrNull, requireUserId } from "./auth";
import { getAccessiblePropertyIds } from "./coowners";
import { supabase } from "./supabase";
import type { DocumentRecord } from "./types";

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const ids = await getAccessiblePropertyIds();
  if (!ids.length) return [];
  const { data } = await supabase
    .from("documents")
    .select("*")
    .in("property_id", ids)
    .order("created_at", { ascending: false });
  return (data as DocumentRecord[]) || [];
}

export async function fetchDocumentsByProperty(propertyId: string): Promise<DocumentRecord[]> {
  const userId = await getUserIdOrNull();
  if (!userId) return [];
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  return (data as DocumentRecord[]) || [];
}

export async function insertBailDocument(propertyId: string, rentalId: string, fileName: string) {
  const userId = await requireUserId();
  return supabase.from("documents").insert([
    {
      property_id: propertyId,
      rental_id: rentalId,
      file_name: fileName,
      document_type: "Bail",
      user_id: userId,
    },
  ]);
}

export async function insertQuittanceDocument(propertyId: string, rentalId: string, fileName: string) {
  const userId = await requireUserId();
  return supabase.from("documents").insert([
    {
      property_id: propertyId,
      rental_id: rentalId,
      file_name: fileName,
      document_type: "Quittance",
      user_id: userId,
    },
  ]);
}
