import type { PageMargins, TrimSizeSpec } from "./types";

/**
 * Formati di trim standard KDP. Copertine non ha un concetto di formato fisso (è un editor a
 * canvas libero): questo elenco è specifico di Interni, non condiviso/importato da altri tool.
 */
export const TRIM_SIZES: TrimSizeSpec[] = [
  { id: "8.5x11", label: '8.5" x 11" (Standard Quaderni/Coloring)', widthIn: 8.5, heightIn: 11 },
  { id: "6x9", label: '6" x 9" (Saggistica/Narrativa)', widthIn: 6, heightIn: 9 },
  { id: "8.25x11", label: '8.25" x 11" (Album/Spartiti)', widthIn: 8.25, heightIn: 11 },
  { id: "8.5x8.5", label: '8.5" x 8.5" (Quadrato)', widthIn: 8.5, heightIn: 8.5 },
];

/** Risoluzione di stampa richiesta da KDP. */
export const DPI = 300;

/**
 * Margini di sicurezza di default (pollici) per la modalità "con margine". L'interno (verso il
 * dorso) è leggermente maggiore per compensare la rilegatura, come da prassi KDP.
 */
export const DEFAULT_MARGINS: PageMargins = {
  topIn: 0.25,
  bottomIn: 0.25,
  insideIn: 0.375,
  outsideIn: 0.25,
};

/** Abbondanza (bleed) richiesta da KDP quando il contenuto tocca il bordo pagina. */
export const BLEED_IN = 0.125;

/** Colore di riempimento di default per il retro nella modalità "fronte/retro con riempimento". */
export const DEFAULT_FILLER_COLOR = "#ffffff";

export const getTrimSize = (id: string): TrimSizeSpec =>
  TRIM_SIZES.find((t) => t.id === id) ?? TRIM_SIZES[0]!;
