/**
 * Estrazione dei contenuti reali dai PDF (solo browser) da inviare all'AI:
 * testo delle prime pagine + anteprime immagine compresse in JPEG base64.
 */

export interface PdfContent {
  /** Testo estratto (troncato) dalle pagine analizzate. */
  text: string;
  /** Anteprime pagina in data URL JPEG. */
  images: string[];
  totalPages: number;
}

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjs;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.72): string {
  return canvas.toDataURL("image/jpeg", quality);
}

async function renderPageToJpeg(page: any, maxWidth = 900): Promise<string> {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(2, Math.max(0.4, maxWidth / base.width));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  if (!context) return "";
  await page.render({ canvas, canvasContext: context, viewport }).promise;
  return canvasToJpeg(canvas);
}

/** Legge un'immagine (PNG/JPG) come data URL JPEG compresso. */
export async function imageFileToJpeg(file: File, maxWidth = 900): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => resolve(null);
      el.src = url;
    });
    if (!img) return null;
    const scale = Math.min(1, maxWidth / (img.naturalWidth || maxWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((img.naturalWidth || maxWidth) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || maxWidth) * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvasToJpeg(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Estrae testo e anteprime da un PDF. `pageIndexes` opzionale per scegliere pagine specifiche. */
export async function extractPdfContent(
  file: File,
  options: { maxImages?: number; maxTextPages?: number; maxChars?: number; pageIndexes?: number[] } = {},
): Promise<PdfContent> {
  const empty: PdfContent = { text: "", images: [], totalPages: 0 };
  if (typeof window === "undefined") return empty;

  const { maxImages = 3, maxTextPages = 6, maxChars = 6000, pageIndexes } = options;

  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const totalPages = pdf.numPages;

  const textPages = Math.min(maxTextPages, totalPages);
  let text = "";
  for (let i = 1; i <= textPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) text += `\n[p.${i}] ${pageText}`;
    if (text.length > maxChars) break;
  }

  const targets = (pageIndexes && pageIndexes.length > 0
    ? pageIndexes
    : Array.from({ length: Math.min(maxImages, totalPages) }, (_, i) => i + 1)
  )
    .map((n) => Math.max(1, Math.min(totalPages, Math.round(n))))
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .slice(0, maxImages);

  const images: string[] = [];
  for (const pageNum of targets) {
    const page = await pdf.getPage(pageNum);
    const jpeg = await renderPageToJpeg(page);
    if (jpeg) images.push(jpeg);
  }

  return { text: text.slice(0, maxChars).trim(), images, totalPages };
}

/** Estrae contenuti da copertina PDF o immagine. */
export async function extractCoverContent(file: File): Promise<PdfContent> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return extractPdfContent(file, { maxImages: 1, maxTextPages: 1, maxChars: 1500 });
  }
  const jpeg = await imageFileToJpeg(file);
  return { text: "", images: jpeg ? [jpeg] : [], totalPages: 1 };
}
