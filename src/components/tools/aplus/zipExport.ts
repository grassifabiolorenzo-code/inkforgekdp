import type { GeneratedModulesText } from "./types";

export interface ModuleCanvases {
  hero: HTMLCanvasElement;
  proof: HTMLCanvasElement;
  value: HTMLCanvasElement;
  grid1: HTMLCanvasElement;
  grid2: HTMLCanvasElement;
  grid3: HTMLCanvasElement;
  comp: HTMLCanvasElement;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Formattazioni testo per-modulo: condivise tra export ZIP/cartella e il pulsante "Copia Testi". */
export function formatHeroProofText(t: GeneratedModulesText["hero"]) {
  return `${t.title}\n\nTITOLO A+:\n${t.heading}\n\nTESTO DESCRITTIVO:\n${t.body}\n\nALT-TEXT SEO:\n${t.alt}`;
}

export function formatValueText(value: GeneratedModulesText["value"]) {
  return `TITOLO SEZIONE:\n${value.title}\n\nPUNTI CHIAVE:\n1. ${value.text1}\n2. ${value.text2}\n3. ${value.text3}\n\nALT-TEXT SEO:\n${value.alt}`;
}

export function formatGridText(grid: GeneratedModulesText["grid"], lang: string, age: string) {
  return (
    `TESTI COLONNE A+ (${lang.toUpperCase()} - Target: ${age}):\n\n` +
    grid.items.map((g, i) => `• SLOT ${i + 1} (Pag. ${grid.pages[i]}):\n${g.title}\n${g.desc}`).join("\n\n")
  );
}

export function formatCompText(comp: GeneratedModulesText["comp"], title: string) {
  return `ISTRUZIONI MODULO COMPARATIVO:\n${comp.instructions}\n\nALT-TEXT SEO:\n${title} — ${comp.alt}`;
}

type ModuleMeta = { title: string; lang: string; niche: string; age: string };

interface FileEntry {
  folder: "immagini" | "testi";
  name: string;
  data: Blob | string;
}

/** Coppie canvas/nome file condivise da ZIP, salvataggio su cartella e download singoli. */
function canvasFileList(canvases: ModuleCanvases): [HTMLCanvasElement, string][] {
  return [
    [canvases.hero, "Modulo_01_Hero_Banner_970x300.png"],
    [canvases.proof, "Modulo_02_Proof_Banner_970x300.png"],
    [canvases.value, "Modulo_03_Value_Highlights_970x300.png"],
    [canvases.grid1, "Modulo_04_Feature_01_300x300.png"],
    [canvases.grid2, "Modulo_04_Feature_02_300x300.png"],
    [canvases.grid3, "Modulo_04_Feature_03_300x300.png"],
    [canvases.comp, "Modulo_05_Header_Compare_150x300.png"],
  ];
}

async function buildFileEntries(
  canvases: ModuleCanvases,
  texts: GeneratedModulesText,
  meta: ModuleMeta,
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  for (const [canvas, filename] of canvasFileList(canvases)) {
    const blob = await canvasToBlob(canvas);
    if (blob) entries.push({ folder: "immagini", name: filename, data: blob });
  }

  entries.push({ folder: "testi", name: "Modulo_01_Hero_Testi.txt", data: formatHeroProofText(texts.hero) });
  entries.push({ folder: "testi", name: "Modulo_02_Proof_Testi.txt", data: formatHeroProofText(texts.proof) });
  entries.push({ folder: "testi", name: "Modulo_03_Value_Testi.txt", data: formatValueText(texts.value) });
  entries.push({
    folder: "testi",
    name: "Modulo_04_Feature_Testi.txt",
    data: formatGridText(texts.grid, meta.lang, meta.age),
  });
  entries.push({ folder: "testi", name: "Modulo_05_Compare_Testi.txt", data: formatCompText(texts.comp, meta.title) });

  return entries;
}

function readmeText(meta: ModuleMeta): string {
  return `A+1 KDP Studio — Pacchetto completo\n\nContenuto:\n- immagini/: tutti i PNG dei moduli generati\n- testi/: tutti i testi associati ai moduli\n\nTitolo/Brand: ${meta.title}\nLingua marketplace: ${meta.lang}\nNicchia: ${meta.niche}\nTarget: ${meta.age}\n\nGenerato il: ${new Date().toLocaleString("it-IT")}\n`;
}

function safeFileTitle(title: string): string {
  return title.trim().replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "") || "Aplus_KDP";
}

/** Genera lo ZIP finale (immagini + testi) con jszip, importato dinamicamente per restare SSR-safe. */
export async function exportModulesAsZip(canvases: ModuleCanvases, texts: GeneratedModulesText, meta: ModuleMeta) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const imagesFolder = zip.folder("immagini")!;
  const textsFolder = zip.folder("testi")!;

  for (const entry of await buildFileEntries(canvases, texts, meta)) {
    (entry.folder === "immagini" ? imagesFolder : textsFolder).file(entry.name, entry.data);
  }
  zip.file("README.txt", readmeText(meta));

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileTitle(meta.title)}_Aplus_Pacchetto_Completo.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

/** Scarica in sequenza ogni file come download separato (fallback quando manca la File System Access API). */
async function downloadEntriesSequentially(entries: FileEntry[], meta: ModuleMeta) {
  const all: { name: string; data: Blob | string }[] = [
    ...entries.map((e) => ({ name: e.name, data: e.data })),
    { name: "README.txt", data: readmeText(meta) },
  ];
  for (const file of all) {
    const blob = typeof file.data === "string" ? new Blob([file.data], { type: "text/plain" }) : file.data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    // Piccola pausa tra un download e l'altro: i browser bloccano download multipli troppo ravvicinati.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

/**
 * Salva tutti i file (immagini + testi) in una cartella scelta dall'utente, tramite la
 * File System Access API (`showDirectoryPicker`). Se il browser non la supporta (es. Safari,
 * Firefox), ricade su un download sequenziale di ogni singolo file.
 */
export async function saveAllToDirectory(canvases: ModuleCanvases, texts: GeneratedModulesText, meta: ModuleMeta) {
  const entries = await buildFileEntries(canvases, texts, meta);
  const picker = (window as unknown as { showDirectoryPicker?: () => Promise<FileSystemDirectoryHandleLike> })
    .showDirectoryPicker;

  if (!picker) {
    await downloadEntriesSequentially(entries, meta);
    return;
  }

  const rootHandle = await picker.call(window);
  const imagesDir = await rootHandle.getDirectoryHandle("immagini", { create: true });
  const textsDir = await rootHandle.getDirectoryHandle("testi", { create: true });

  for (const entry of entries) {
    const dir = entry.folder === "immagini" ? imagesDir : textsDir;
    const fileHandle = await dir.getFileHandle(entry.name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(entry.data);
    await writable.close();
  }

  const readmeHandle = await rootHandle.getFileHandle("README.txt", { create: true });
  const readmeWritable = await readmeHandle.createWritable();
  await readmeWritable.write(readmeText(meta));
  await readmeWritable.close();
}

/** Sottoinsieme minimo della File System Access API usato qui (non nelle lib DOM standard di TS). */
interface FileSystemDirectoryHandleLike {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandleLike>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandleLike>;
}

interface FileSystemFileHandleLike {
  createWritable(): Promise<{ write(data: Blob | string): Promise<void>; close(): Promise<void> }>;
}
