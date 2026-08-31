import { BLEED_IN, DPI } from "./constants";
import { drawTemplate } from "./templateLibrary";
import type { FillMode, InteriorPage, PageMargins, PrintMode } from "./types";

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Impossibile leggere l'immagine "${file.name}".`));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Disegna il contenuto di una pagina (immagine, template o vuota) su un canvas della
 * risoluzione di stampa richiesta. I margini "inside"/"outside" vengono specchiati in base a
 * `isRecto`: su una pagina destra (recto) l'interno/dorso è a sinistra, su una sinistra (verso)
 * è a destra.
 * - "cover" (solo immagini): l'immagine riempie l'intera pagina (bleed incluso), ritaglia l'eccesso.
 * - "contain" (solo immagini): adattamento automatico dentro i margini, centrata, nessun ritaglio.
 * - I template disegnano da soli la propria impaginazione interna e ignorano fillMode/margini.
 */
async function renderContentCanvas(
  page: InteriorPage,
  pageWIn: number,
  pageHIn: number,
  margins: PageMargins,
  isRecto: boolean,
  fillMode: FillMode,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pageWIn * DPI);
  canvas.height = Math.round(pageHIn * DPI);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (page.kind === "template" && page.templateId) {
    drawTemplate(ctx, page.templateId, canvas.width, canvas.height);
    return canvas;
  }

  if (page.kind !== "image" || !page.file) return canvas; // pagina vuota

  const img = await loadImage(page.file);

  if (fillMode === "cover") {
    const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    return canvas;
  }

  const leftIn = isRecto ? margins.insideIn : margins.outsideIn;
  const rightIn = isRecto ? margins.outsideIn : margins.insideIn;
  const topPx = margins.topIn * DPI;
  const bottomPx = margins.bottomIn * DPI;
  const leftPx = leftIn * DPI;
  const rightPx = rightIn * DPI;

  const boxW = Math.max(1, canvas.width - leftPx - rightPx);
  const boxH = Math.max(1, canvas.height - topPx - bottomPx);
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, leftPx + (boxW - w) / 2, topPx + (boxH - h) / 2, w, h);
  return canvas;
}

function renderFillerCanvas(pageWIn: number, pageHIn: number, colorHex: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(pageWIn * DPI);
  canvas.height = Math.round(pageHIn * DPI);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = colorHex || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export interface InteriorDocSpec {
  trimWidthIn: number;
  trimHeightIn: number;
  margins: PageMargins;
  defaultFillMode: FillMode;
  printMode: PrintMode;
  fillerColor: string;
}

function resolveFillMode(page: InteriorPage, defaultFillMode: FillMode): FillMode {
  return page.fillModeOverride === "default" ? defaultFillMode : page.fillModeOverride;
}

/** Un elemento della sequenza fisica finale delle pagine (dopo l'eventuale inserimento dei riempimenti). */
interface PhysicalPage {
  source: InteriorPage | null;
  isFiller: boolean;
}

/**
 * Espande l'elenco di pagine-contenuto nella sequenza fisica finale. In modalità
 * "singleSidedWithFiller" ogni pagina-immagine viene seguita da una pagina di riempimento,
 * cosa che la porta sempre su una pagina destra (recto) e mantiene il retro "neutro".
 */
function buildPhysicalSequence(pages: InteriorPage[], printMode: PrintMode): PhysicalPage[] {
  if (printMode === "continuous") {
    return pages.map((p) => ({ source: p, isFiller: false }));
  }
  const sequence: PhysicalPage[] = [];
  for (const page of pages) {
    sequence.push({ source: page, isFiller: false });
    if (page.kind === "image") sequence.push({ source: null, isFiller: true });
  }
  return sequence;
}

/** Genera un'anteprima canvas per la prima pagina fisica del documento. */
export async function renderFirstPagePreview(pages: InteriorPage[], spec: InteriorDocSpec): Promise<HTMLCanvasElement | null> {
  const sequence = buildPhysicalSequence(pages, spec.printMode);
  const first = sequence[0];
  if (!first) return null;

  const usesBleed = !first.isFiller && first.source
    ? resolveFillMode(first.source, spec.defaultFillMode) === "cover"
    : false;
  const bleed = usesBleed ? BLEED_IN : 0;
  const pageWIn = spec.trimWidthIn + bleed * 2;
  const pageHIn = spec.trimHeightIn + bleed * 2;

  if (first.isFiller) return renderFillerCanvas(pageWIn, pageHIn, spec.fillerColor);

  const page = first.source!;
  // La prima pagina fisica è sempre recto (destra).
  return renderContentCanvas(page, pageWIn, pageHIn, spec.margins, true, resolveFillMode(page, spec.defaultFillMode));
}

/** Anteprima canvas per una singola pagina, indipendente dal documento (usata per il download del singolo file). */
export async function renderSinglePagePreview(
  page: InteriorPage,
  spec: InteriorDocSpec,
  isRecto = true,
): Promise<HTMLCanvasElement> {
  const bleed = resolveFillMode(page, spec.defaultFillMode) === "cover" ? BLEED_IN : 0;
  return renderContentCanvas(
    page,
    spec.trimWidthIn + bleed * 2,
    spec.trimHeightIn + bleed * 2,
    spec.margins,
    isRecto,
    resolveFillMode(page, spec.defaultFillMode),
  );
}

/**
 * Assembla tutte le pagine in un unico PDF pronto per KDP. Le dimensioni fisiche della pagina
 * restano uniformi in tutto il documento: se almeno una pagina usa "piena pagina", l'intero PDF
 * include il bleed KDP (0.125") su tutti i lati.
 */
export async function buildInteriorPdf(pages: InteriorPage[], spec: InteriorDocSpec): Promise<Blob> {
  if (pages.length === 0) throw new Error("Aggiungi almeno una pagina prima di generare il PDF.");

  const { jsPDF } = await import("jspdf");

  const sequence = buildPhysicalSequence(pages, spec.printMode);
  const usesBleedAnywhere = sequence.some(
    (p) => !p.isFiller && p.source && resolveFillMode(p.source, spec.defaultFillMode) === "cover",
  );
  const bleed = usesBleedAnywhere ? BLEED_IN : 0;
  const pageWIn = spec.trimWidthIn + bleed * 2;
  const pageHIn = spec.trimHeightIn + bleed * 2;
  const orientation = pageWIn > pageHIn ? "landscape" : "portrait";

  const doc = new jsPDF({ unit: "in", format: [pageWIn, pageHIn], orientation });

  for (let i = 0; i < sequence.length; i++) {
    const physical = sequence[i]!;
    const isRecto = i % 2 === 0;

    const canvas = physical.isFiller
      ? renderFillerCanvas(pageWIn, pageHIn, spec.fillerColor)
      : await renderContentCanvas(
          physical.source!,
          pageWIn,
          pageHIn,
          spec.margins,
          isRecto,
          resolveFillMode(physical.source!, spec.defaultFillMode),
        );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) doc.addPage([pageWIn, pageHIn], orientation);
    doc.addImage(dataUrl, "JPEG", 0, 0, pageWIn, pageHIn);
  }

  return doc.output("blob");
}
