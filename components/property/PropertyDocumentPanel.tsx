"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Eye, FileText, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateFr } from "@/lib/format";
import {
  deletePropertyFile,
  downloadPropertyFile,
  formatFileSize,
  getPropertyFileDownloadUrl,
  getPropertyFilePreviewKind,
  listPropertyFiles,
  renamePropertyFile,
  uploadPropertyFile,
  type PropertyFileDocumentType,
  type PropertyFilePreviewKind,
} from "@/lib/propertyDocuments";
import type { DocumentRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type Category = {
  label: string;
  documentType: PropertyFileDocumentType;
};

type PreviewState = {
  doc: DocumentRecord;
  kind: PropertyFilePreviewKind;
  url: string | null;
  loading: boolean;
  error: string | null;
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
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentRecord | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
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
      await downloadPropertyFile(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Téléchargement impossible.");
    }
  }

  async function openPreview(doc: DocumentRecord) {
    if (!doc.storage_path) return;
    const kind = getPropertyFilePreviewKind(doc);
    setPreview({ doc, kind, url: null, loading: true, error: null });

    if (kind === "unsupported") {
      setPreview({
        doc,
        kind,
        url: null,
        loading: false,
        error: "Aperçu indisponible pour ce format. Télécharge le fichier pour l’ouvrir.",
      });
      return;
    }

    try {
      const url = await getPropertyFileDownloadUrl(doc.storage_path);
      setPreview({ doc, kind, url, loading: false, error: null });
    } catch (err) {
      setPreview({
        doc,
        kind,
        url: null,
        loading: false,
        error: err instanceof Error ? err.message : "Impossible d’ouvrir l’aperçu.",
      });
    }
  }

  async function handleDelete(doc: DocumentRecord) {
    if (!window.confirm(`Supprimer « ${doc.file_name} » ?`)) return;
    try {
      await deletePropertyFile(doc);
      if (preview?.doc.id === doc.id) setPreview(null);
      if (renameDoc?.id === doc.id) setRenameDoc(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  function openRename(doc: DocumentRecord) {
    setRenameDoc(doc);
    setRenameValue(doc.file_name);
    setError(null);
  }

  async function handleRename(event: React.FormEvent) {
    event.preventDefault();
    if (!renameDoc) return;
    setRenaming(true);
    try {
      const updated = await renamePropertyFile(renameDoc, renameValue);
      setRenameDoc(null);
      if (preview?.doc.id === updated.id) {
        setPreview((current) => (current ? { ...current, doc: updated } : current));
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renommage impossible.");
    } finally {
      setRenaming(false);
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
            {visibleFiles.map((doc) => {
              const kind = getPropertyFilePreviewKind(doc);
              return (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left hover:bg-muted/40"
                    onClick={() => void openPreview(doc)}
                  >
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium underline-offset-2 hover:underline">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                        {doc.created_at ? ` · ${formatDateFr(doc.created_at)}` : ""}
                        {kind === "unsupported" ? " · aperçu limité" : ""}
                      </p>
                    </div>
                  </button>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Voir"
                      onClick={() => void openPreview(doc)}
                    >
                      <Eye />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      aria-label="Renommer"
                      onClick={() => openRename(doc)}
                    >
                      <Pencil />
                    </Button>
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
              );
            })}
          </ul>
        )}
      </CardContent>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-4xl" showCloseButton>
          <DialogHeader>
            <DialogTitle className="truncate">{preview?.doc.file_name || "Aperçu"}</DialogTitle>
            <DialogDescription>Visualisation dans Locagest — sans téléchargement obligatoire.</DialogDescription>
          </DialogHeader>

          <div className="min-h-64 rounded-lg border border-border bg-muted/20 p-2">
            {preview?.loading && (
              <p className="p-8 text-center text-sm text-muted-foreground">Chargement de l’aperçu...</p>
            )}
            {!preview?.loading && preview?.error && (
              <p className="p-8 text-center text-sm text-muted-foreground">{preview.error}</p>
            )}
            {!preview?.loading && !preview?.error && preview?.url && preview.kind === "image" && (
              // eslint-disable-next-line @next/next/no-img-element -- URL signée Supabase temporaire
              <img
                src={preview.url}
                alt={preview.doc.file_name}
                className="mx-auto max-h-[70vh] w-auto max-w-full object-contain"
              />
            )}
            {!preview?.loading && !preview?.error && preview?.url && preview.kind === "pdf" && (
              <iframe
                title={preview.doc.file_name}
                src={preview.url}
                className="h-[70vh] w-full rounded-md bg-background"
              />
            )}
          </div>

          <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
            <Button type="button" variant="outline" onClick={() => setPreview(null)}>
              Fermer
            </Button>
            {preview?.doc && (
              <Button type="button" onClick={() => void handleDownload(preview.doc)}>
                Télécharger
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(renameDoc)} onOpenChange={(open) => !open && setRenameDoc(null)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Renommer le document</DialogTitle>
            <DialogDescription>
              L’extension est conservée automatiquement si tu ne la saisis pas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rename-file">Nouveau nom</Label>
              <Input
                id="rename-file"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
              <Button type="button" variant="outline" onClick={() => setRenameDoc(null)} disabled={renaming}>
                Annuler
              </Button>
              <Button type="submit" disabled={renaming || !renameValue.trim()}>
                {renaming ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
