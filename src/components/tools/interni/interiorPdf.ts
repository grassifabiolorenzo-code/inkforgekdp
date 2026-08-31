import { BLEED_IN, DPI } from "./constants";
import type { FillMode, InteriorPage } from "./types";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossibile leggere l'immagine "${file.name}".`));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Disegna una pagina (immagine o vuota) su un canvas della risoluzione di stampa richiesta.
 * - "cover": l'immagine riempie l'intera pagina (bleed incluso), ritagliando l'eccesso.
 * - "contain": l'immagine viene adattata dentro il margine impostato, ridimensionamento
 *   automatico proporzionale, centrata, senza ritaglio.
 */
function renderPageCanvas(
  img: HTMLImageElement | null,
  pageWIn: number,
  pageHIn: number,
  marginIn: number,
  fillMode: FillMode,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pageWIn * DPI);
  canvas.height = Math.round(pageHIn * DPI);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!img) return canvas;

  if (fillMode === "cover") {
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  } else {
    const marginPx = marginIn * DPI;
    const boxW = Math.max(1, canvas.width - marginPx * 2);
    const boxH = Math.max(1, canvas.height - marginPx * 2);
    const scale = Math.min(boxW / img.width, boxH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, marginPx + (boxW - w) / 2, marginPx + (boxH - h) / 2, w, h);
  }
  return canvas;
}

export interface InteriorDocSpec {
  trimWidthIn: number;
  trimHeightIn: number;
  marginIn: number;
  defaultFillMode: FillMode;
}

function resolveFillMode(page: InteriorPage, defaultFillMode: FillMode): FillMode {
  return page.fillModeOverride === "default" ? defaultFillMode : page.fillModeOverride;
}

/** Genera un'anteprima canvas per una singola pagina, usando le impostazioni correnti del documento. */
export async function renderPagePreview(page: InteriorPage, spec: InteriorDocSpec): Promise<HTMLCanvasElement> {
  const usesBleed = resolveFillMode(page, spec.defaultFillMode) === "cover";
  const bleed = usesBleed ? BLEED_IN : 0;
  const img = page.kind === "image" && page.file ? await loadImage(page.file) : null;
  return renderPageCanvas(
    img,
    spec.trimWidthIn + bleed * 2,
    spec.trimHeightIn + bleed * 2,
    spec.marginIn,
    resolveFillMode(page, spec.defaultFillMode),
  );
}

/**
 * Assembla tutte le pagine in un unico PDF pronto per KDP. Le dimensioni fisiche della pagina
 * restano uniformi in tutto il documento: se almeno una pagina usa "piena pagina", l'intero PDF
 * include il bleed KDP (0.125") su tutti i lati, e le pagine in modalità "con margine" lasciano
 * semplicemente bianca quella fascia di abbondanza.
 */
export async function buildInteriorPdf(pages: InteriorPage[], spec: InteriorDocSpec): Promise<Blob> {
  if (pages.length === 0) throw new Error("Aggiungi almeno una pagina prima di generare il PDF.");

  const { jsPDF } = await import("jspdf");

  const usesBleedAnywhere = pages.some((p) => resolveFillMode(p, spec.defaultFillMode) === "cover");
  const bleed = usesBleedAnywhere ? BLEED_IN : 0;
  const pageWIn = spec.trimWidthIn + bleed * 2;
  const pageHIn = spec.trimHeightIn + bleed * 2;
  const orientation = pageWIn > pageHIn ? "landscape" : "portrait";

  const doc = new jsPDF({ unit: "in", format: [pageWIn, pageHIn], orientation });

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const img = page.kind === "image" && page.file ? await loadImage(page.file) : null;
    const canvas = renderPageCanvas(img, pageWIn, pageHIn, spec.marginIn, resolveFillMode(page, spec.defaultFillMode));
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    if (i > 0) doc.addPage([pageWIn, pageHIn], orientation);
    doc.addImage(dataUrl, "JPEG", 0, 0, pageWIn, pageHIn);
  }

  return doc.output("blob");
}
