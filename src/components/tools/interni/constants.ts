import type { TrimSizeSpec } from "./types";

/** Stessi formati KDP offerti in Copertine, per coerenza tra i due tool. */
export const TRIM_SIZES: TrimSizeSpec[] = [
  { id: "8.5x11", label: '8.5" x 11" (Standard Quaderni/Coloring)', widthIn: 8.5, heightIn: 11 },
  { id: "6x9", label: '6" x 9" (Saggistica/Narrativa)', widthIn: 6, heightIn: 9 },
  { id: "8.25x11", label: '8.25" x 11" (Album/Spartiti)', widthIn: 8.25, heightIn: 11 },
  { id: "8.5x8.5", label: '8.5" x 8.5" (Quadrato)', widthIn: 8.5, heightIn: 8.5 },
];

/** Risoluzione di stampa richiesta da KDP. */
export const DPI = 300;

/** Margine di sicurezza di default (pollici) per la modalità "con margine". */
export const DEFAULT_MARGIN_IN = 0.25;

/** Abbondanza (bleed) richiesta da KDP quando il contenuto tocca il bordo pagina. */
export const BLEED_IN = 0.125;

export const getTrimSize = (id: string): TrimSizeSpec =>
  TRIM_SIZES.find((t) => t.id === id) ?? TRIM_SIZES[0]!;
