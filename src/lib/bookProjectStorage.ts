import { supabase } from "@/integrations/supabase/client";

/**
 * Upload/download dei file di un progetto libro direttamente dal browser a
 * Supabase Storage (bucket "book-projects", privato — vedi la migration
 * 20260902000000_book_projects.sql per le policy). Mai attraverso il server:
 * i file possono pesare decine di MB, ben oltre ogni limite sensato per il
 * payload di una server function.
 */

const BUCKET = "book-projects";

export type ProjectFileKind = "cover" | "interior";

function extensionFor(file: File, kind: ProjectFileKind): string {
  // L'interno è sempre un PDF in ogni tool che lo consuma (Pubblicazione, A+, Blurb, Bio, Promo).
  if (kind === "interior") return "pdf";
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/svg+xml") return "svg";
  return "jpg";
}

export async function uploadProjectFile(
  userId: string,
  projectId: string,
  kind: ProjectFileKind,
  file: File,
): Promise<{ path: string; mime: string }> {
  const ext = extensionFor(file, kind);
  const path = `${userId}/${projectId}/${kind}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, ...(file.type ? { contentType: file.type } : {}) });
  if (error) throw new Error(error.message);
  return { path, mime: file.type || "application/octet-stream" };
}

/** Scarica un file salvato e lo restituisce come File, pronto per le stesse funzioni di estrazione già usate per l'upload manuale. */
export async function downloadProjectFile(path: string, filename: string): Promise<File> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw new Error(error.message);
  return new File([data], filename, { type: data.type });
}

export async function removeProjectFiles(paths: (string | null | undefined)[]): Promise<void> {
  const valid = paths.filter((p): p is string => !!p);
  if (valid.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(valid);
  if (error) throw new Error(error.message);
}
