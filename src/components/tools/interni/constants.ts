import type { PageMargins, TrimSizeSpec } from "./types";

/**
 * Tutti i 16 formati di trim ufficiali per la stampa in brossura (paperback) di Amazon KDP —
 * https://kdp.amazon.com/help?topicId=GVBQ3CMEQW3W2VL6 — condivisi con il selettore "Formato
 * Libro" di Copertine (public/tools/copertine-studio.html, stesso id "WxH"). "Standard" = costo
 * di stampa per pagina più basso; "Grande" = oltre 6.12"×9" comporta un costo per pagina
 * maggiore (royalty più bassa a parità di prezzo di copertina).
 *
 * Non coperti qui: i 5 formati per copertina rigida (hardcover) — hanno un calcolo del dorso e
 * un template di copertina diversi da quello paperback già implementato in Copertine.
 */
export const TRIM_SIZES: TrimSizeSpec[] = [
  {
    id: "5x8",
    label: '5" x 8" (Narrativa tascabile)',
    widthIn: 5,
    heightIn: 8,
    category: "Standard",
  },
  {
    id: "5.06x7.81",
    label: '5.06" x 7.81" (Narrativa compatta)',
    widthIn: 5.06,
    heightIn: 7.81,
    category: "Standard",
  },
  {
    id: "5.25x8",
    label: '5.25" x 8" (Narrativa)',
    widthIn: 5.25,
    heightIn: 8,
    category: "Standard",
  },
  {
    id: "5.5x8.5",
    label: '5.5" x 8.5" (Narrativa/Saggistica)',
    widthIn: 5.5,
    heightIn: 8.5,
    category: "Standard",
  },
  {
    id: "6x9",
    label: '6" x 9" (Saggistica/Narrativa)',
    widthIn: 6,
    heightIn: 9,
    category: "Standard",
  },
  {
    id: "6.14x9.21",
    label: '6.14" x 9.21" (Narrativa, formato grande)',
    widthIn: 6.14,
    heightIn: 9.21,
    category: "Grande",
  },
  {
    id: "6.69x9.61",
    label: '6.69" x 9.61" (Saggistica, formato grande)',
    widthIn: 6.69,
    heightIn: 9.61,
    category: "Grande",
  },
  {
    id: "7x10",
    label: '7" x 10" (Manuali/Workbook)',
    widthIn: 7,
    heightIn: 10,
    category: "Grande",
  },
  {
    id: "7.44x9.69",
    label: '7.44" x 9.69" (Saggistica illustrata)',
    widthIn: 7.44,
    heightIn: 9.69,
    category: "Grande",
  },
  {
    id: "7.5x9.25",
    label: '7.5" x 9.25" (Manuali tecnici)',
    widthIn: 7.5,
    heightIn: 9.25,
    category: "Grande",
  },
  { id: "8x10", label: '8" x 10" (Album/Manuali)', widthIn: 8, heightIn: 10, category: "Grande" },
  {
    id: "8.25x6",
    label: '8.25" x 6" (Orizzontale — spartiti/attività)',
    widthIn: 8.25,
    heightIn: 6,
    category: "Grande",
  },
  {
    id: "8.25x8.25",
    label: '8.25" x 8.25" (Quadrato)',
    widthIn: 8.25,
    heightIn: 8.25,
    category: "Grande",
  },
  {
    id: "8.5x8.5",
    label: '8.5" x 8.5" (Quadrato)',
    widthIn: 8.5,
    heightIn: 8.5,
    category: "Grande",
  },
  {
    id: "8.5x11",
    label: '8.5" x 11" (Standard Quaderni/Coloring)',
    widthIn: 8.5,
    heightIn: 11,
    category: "Grande",
  },
  {
    id: "8.27x11.69",
    label: '8.27" x 11.69" (A4)',
    widthIn: 8.27,
    heightIn: 11.69,
    category: "Grande",
  },
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
  TRIM_SIZES.find((t) => t.id === id) ?? TRIM_SIZES[4]!; // fallback: 6"x9", il formato più comune

/**
 * Margine minimo verso il dorso ("gutter") richiesto da KDP in base al numero di pagine del
 * libro — cresce con lo spessore perché la rilegatura "mangia" più spazio interno. Tabella
 * ufficiale: https://kdp.amazon.com/help?topicId=GVBQ3CMEQW3W2VL6
 */
const KDP_GUTTER_TABLE: { maxPages: number; insideIn: number }[] = [
  { maxPages: 150, insideIn: 0.375 },
  { maxPages: 300, insideIn: 0.5 },
  { maxPages: 500, insideIn: 0.625 },
  { maxPages: 700, insideIn: 0.75 },
  { maxPages: 828, insideIn: 0.875 },
];

/**
 * Margini consigliati da KDP per un dato numero di pagine fisiche e scelta di abbondanza: il
 * dorso (inside) varia con lo spessore del libro, gli altri tre lati sono un minimo fisso (più
 * ampio con l'abbondanza, per lasciare margine all'imprecisione del taglio). Sono solo un punto
 * di partenza: restano modificabili liberamente come ogni altro valore del documento.
 */
export function suggestedKdpMargins(pageCount: number, bleed: boolean): PageMargins {
  const entry =
    KDP_GUTTER_TABLE.find((e) => pageCount <= e.maxPages) ??
    KDP_GUTTER_TABLE[KDP_GUTTER_TABLE.length - 1]!;
  const outside = bleed ? 0.375 : 0.25;
  return { topIn: outside, bottomIn: outside, insideIn: entry.insideIn, outsideIn: outside };
}
