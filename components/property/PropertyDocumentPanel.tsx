"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateFr } from "@/lib/format";
import {
  deletePropertyFile,
  formatFileSize,
  getPropertyFileDownloadUrl,
  listPropertyFiles,
  uploadPropertyFile,
  type PropertyFileDocumentType,
} from "@/lib/propertyDocuments";
import type { DocumentRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type Category = {
  label: string;
  documentType: PropertyFileDocumentType;
};

export function PropertyDocumentPanel({
  propertyId,
  title,
  description,
  categories,
  rentalId,
}: {
  propertyId: string;
  title: string;
  description: string;
  categories: Category[];
  rentalId?: string | null;
}) {
  const [activeType, setActiveType] = useState<PropertyFileDocumentType>(categories[0].documentType);
  const [files, setFiles] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const types = categories.map((c) => c.documentType);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPropertyFiles(propertyId, types);
      setFiles(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les documents.");
    } finally {
      setLoading(false);
    }
  }, [propertyId, types.join("|")]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const visibleFiles = files.filter((file) => file.document_type === activeType);

  async function handleFiles(fileList: FileList | File[]) {
    const selected = Array.from(fileList);
    if (!selected.length) return;

    setUploading(true);
    setError(null);
    try {
      for (const file of selected) {
        await uploadPropertyFile(propertyId, activeType, file, rentalId);
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l’upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDownload(doc: DocumentRecord) {
    if (!doc.storage_path) return;
    try {
      const url = await getPropertyFileDownloadUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Téléchargement impossible.");
    }
  }

  async function handleDelete(doc: DocumentRecord) {
    if (!window.confirm(`Supprimer « ${doc.file_name} » ?`)) return;
    try {
      await deletePropertyFile(doc);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.documentType}
                type="button"
                size="sm"
                variant={activeType === category.documentType ? "default" : "outline"}
                onClick={() => setActiveType(category.documentType)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        )}

        <div
          onDragEnter={(event) => {
            event.preventDefault();
            dragDepth.current += 1;
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            dragDepth.current -= 1;
            if (dragDepth.current <= 0) {
              dragDepth.current = 0;
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            dragDepth.current = 0;
            setDragging(false);
            if (event.dataTransfer.files?.length) {
              void handleFiles(event.dataTransfer.files);
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-8 text-center transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20",
            uploading && "opacity-70",
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {uploading ? "Envoi en cours..." : "Glissez-déposez vos fichiers ici"}
            </p>
            <p className="text-xs text-muted-foreground">PDF, images, Word ou Excel — 20 Mo max</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            Parcourir
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,application/pdf,image/*"
            onChange={(event) => {
              if (event.target.files?.length) void handleFiles(event.target.files);
            }}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : visibleFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun document pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {visibleFiles.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="flex min-w-0 items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                      {doc.created_at ? ` · ${formatDateFr(doc.created_at)}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Télécharger"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Supprimer"
                    onClick={() => handleDelete(doc)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
