import { DPI } from "./constants";
import { drawTemplate } from "./templateLibrary";
import type { InteriorPage } from "./types";

/**
 * Piccolo editor canvas per scrivere un testo libero su una pagina template (una volta
 * sbloccata) o sulla pagina bianca — non sulle pagine-immagine dell'utente né sul Sudoku (ha
 * senso solo su pagine "vuote" di contenuto testuale). Il risultato viene sempre "cotto" in
 * un'immagine PNG: la pagina diventa a tutti gli effetti una normale pagina-immagine, senza
 * bisogno di estendere il modello dati o la pipeline di export esistente.
 */
export interface TextOverlayState {
  text: string;
  /** Dimensione del font come frazione dell'altezza pagina (0-1): resta coerente a qualunque risoluzione. */
  fontSize: number;
  color: string;
  /** Posizione del testo come frazione della pagina (0-1, 0=bordo sinistro/alto). */
  xFrac: number;
  yFrac: number;
  align: "left" | "center" | "right";
}

export const DEFAULT_TEXT_OVERLAY: TextOverlayState = {
  text: "",
  fontSize: 0.05,
  color: "#1f2937",
  xFrac: 0.5,
  yFrac: 0.5,
  align: "center",
};

/** Disegna solo il testo (nessuno sfondo): condiviso da anteprima interattiva ed export finale. */
export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  overlay: TextOverlayState,
): void {
  const text = overlay.text.trim();
  if (!text) return;

  const fontPx = Math.max(1, Math.round(overlay.fontSize * h));
  ctx.font = `${fontPx}px sans-serif`;
  ctx.fillStyle = overlay.color;
  ctx.textAlign = overlay.align;
  ctx.textBaseline = "middle";

  const lines = text.split("\n");
  const lineHeight = fontPx * 1.25;
  const startY = overlay.yFrac * h - ((lines.length - 1) * lineHeight) / 2;
  const x = overlay.xFrac * w;
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/** Disegna il contenuto di base della pagina (template o bianco) + il testo sopra, su un canvas
 * già dimensionato. Usata sia per l'anteprima interattiva (bassa risoluzione) sia per l'export
 * finale (risoluzione di stampa) — stessa logica, stesse proporzioni. */
export function drawPageWithTextOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  page: InteriorPage,
  overlay: TextOverlayState,
  mirrored: boolean,
): void {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  if (page.kind === "template" && page.templateId) {
    drawTemplate(ctx, page.templateId, w, h, page.templateSeed, mirrored);
  }
  drawTextOverlay(ctx, w, h, overlay);
}

/** Genera l'immagine finale (a risoluzione di stampa) da usare come nuovo file della pagina. */
export async function renderPageWithTextOverlayToFile(
  page: InteriorPage,
  trimWidthIn: number,
  trimHeightIn: number,
  overlay: TextOverlayState,
  mirrored: boolean,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(trimWidthIn * DPI));
  canvas.height = Math.max(1, Math.round(trimHeightIn * DPI));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossibile creare il contesto di disegno.");
  drawPageWithTextOverlay(ctx, canvas.width, canvas.height, page, overlay, mirrored);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Impossibile creare l'immagine della pagina."))),
      "image/png",
    );
  });
  return new File([blob], "pagina-con-testo.png", { type: "image/png" });
}
