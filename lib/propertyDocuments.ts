import { requireUserId } from "./auth";
import { supabase } from "./supabase";
import type { DocumentRecord, DocumentType } from "./types";

export const PROPERTY_FILES_BUCKET = "property-files";

export const PROPERTY_FILE_TYPES = [
  "Diagnostic",
  "EtatDesLieuxEntree",
  "EtatDesLieuxSortie",
] as const;

export type PropertyFileDocumentType = (typeof PROPERTY_FILE_TYPES)[number];

const MAX_FILE_BYTES = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "doc",
  "docx",
  "xls",
  "xlsx",
]);

function sanitizeFileName(name: string) {
  return name.replace(/[^\w.\-() ]+/g, "_").trim() || "document";
}

function extensionOf(name: string) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1)! : "";
}

export function validatePropertyFile(file: File): string | null {
  if (file.size <= 0) return "Fichier vide.";
  if (file.size > MAX_FILE_BYTES) return "Fichier trop volumineux (max 20 Mo).";
  const ext = extensionOf(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return "Format non supporté (PDF, images, Word ou Excel).";
  }
  return null;
}

export async function listPropertyFiles(
  propertyId: string,
  documentTypes: PropertyFileDocumentType[],
): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("property_id", propertyId)
    .in("document_type", documentTypes)
    .not("storage_path", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DocumentRecord[]) || [];
}

export async function uploadPropertyFile(
  propertyId: string,
  documentType: PropertyFileDocumentType,
  file: File,
  rentalId?: string | null,
): Promise<DocumentRecord> {
  const validationError = validatePropertyFile(file);
  if (validationError) throw new Error(validationError);

  const userId = await requireUserId();
  const safeName = sanitizeFileName(file.name);
  const storagePath = `${propertyId}/${documentType}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_FILES_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Échec de l’upload.");
  }

  const { data, error } = await supabase
    .from("documents")
    .insert([
      {
        property_id: propertyId,
        rental_id: rentalId || null,
        file_name: safeName,
        document_type: documentType as DocumentType,
        storage_path: storagePath,
        mime_type: file.type || null,
        file_size: file.size,
        user_id: userId,
      },
    ])
    .select("*")
    .maybeSingle();

  if (error || !data) {
    await supabase.storage.from(PROPERTY_FILES_BUCKET).remove([storagePath]);
    throw new Error(error?.message || "Impossible d’enregistrer le document.");
  }

  return data as DocumentRecord;
}

export async function getPropertyFileDownloadUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(PROPERTY_FILES_BUCKET)
    .createSignedUrl(storagePath, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Impossible de générer le lien de téléchargement.");
  }
  return data.signedUrl;
}

/** Force le téléchargement local (évite l’ouverture seule dans l’onglet). */
export async function downloadPropertyFile(doc: DocumentRecord) {
  if (!doc.storage_path) {
    throw new Error("Ce document n’a pas de fichier associé.");
  }

  const signedUrl = await getPropertyFileDownloadUrl(doc.storage_path);
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error("Impossible de récupérer le fichier pour le téléchargement.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = doc.file_name || "document";
  anchor.rel = "noopener";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function deletePropertyFile(document: DocumentRecord) {
  if (!document.storage_path) {
    throw new Error("Ce document n’a pas de fichier associé.");
  }

  const { error: storageError } = await supabase.storage
    .from(PROPERTY_FILES_BUCKET)
    .remove([document.storage_path]);

  if (storageError) {
    throw new Error(storageError.message || "Impossible de supprimer le fichier.");
  }

  const { error } = await supabase.from("documents").delete().eq("id", document.id);
  if (error) throw new Error(error.message);
}

/** Conserve l’extension d’origine si l’utilisateur ne la saisit pas. */
export function buildRenamedFileName(currentName: string, nextName: string) {
  const trimmed = nextName.trim();
  if (!trimmed) throw new Error("Le nom ne peut pas être vide.");

  const currentExt = currentName.includes(".") ? currentName.slice(currentName.lastIndexOf(".")) : "";
  const hasExt = trimmed.includes(".") && trimmed.lastIndexOf(".") > 0;
  const withExt = hasExt || !currentExt ? trimmed : `${trimmed}${currentExt}`;
  return sanitizeFileName(withExt);
}

function storageUuidPrefix(storagePath: string) {
  const base = storagePath.split("/").pop() || "";
  const match = base.match(
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  );
  return match?.[1] || crypto.randomUUID();
}

export async function renamePropertyFile(document: DocumentRecord, nextName: string): Promise<DocumentRecord> {
  const fileName = buildRenamedFileName(document.file_name, nextName);
  if (!document.storage_path) {
    throw new Error("Ce document n’a pas de fichier associé.");
  }

  const uuid = storageUuidPrefix(document.storage_path);
  const newStoragePath = `${document.property_id}/${document.document_type}/${uuid}-${fileName}`;
  const oldStoragePath = document.storage_path;

  if (newStoragePath !== oldStoragePath) {
    const { error: moveError } = await supabase.storage
      .from(PROPERTY_FILES_BUCKET)
      .move(oldStoragePath, newStoragePath);

    if (moveError) {
      throw new Error(moveError.message || "Impossible de renommer le fichier dans le stockage.");
    }
  }

  const { data, error } = await supabase
    .from("documents")
    .update({ file_name: fileName, storage_path: newStoragePath })
    .eq("id", document.id)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    // Tente de remettre le fichier à l’ancien chemin si la BDD échoue.
    if (newStoragePath !== oldStoragePath) {
      await supabase.storage.from(PROPERTY_FILES_BUCKET).move(newStoragePath, oldStoragePath);
    }
    throw new Error(error?.message || "Impossible de renommer le document.");
  }

  return data as DocumentRecord;
}

export function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export type PropertyFilePreviewKind = "image" | "pdf" | "unsupported";

export function getPropertyFilePreviewKind(doc: Pick<DocumentRecord, "mime_type" | "file_name">): PropertyFilePreviewKind {
  const mime = (doc.mime_type || "").toLowerCase();
  const name = (doc.file_name || "").toLowerCase();

  if (mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|heic)$/i.test(name)) {
    return "image";
  }
  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    return "pdf";
  }
  return "unsupported";
}
