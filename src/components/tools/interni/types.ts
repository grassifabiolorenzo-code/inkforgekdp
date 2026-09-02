/** "WxH" in pollici, es. "6x9" — stesso formato stringa usato dal selettore formato di Copertine
 * (public/tools/copertine-studio.html), per coerenza tra i due tool. */
export type TrimSizeId = string;

export interface TrimSizeSpec {
  id: TrimSizeId;
  label: string;
  widthIn: number;
  heightIn: number;
  /** "Grande" = oltre le soglie KDP che comportano un costo di stampa per pagina più alto. */
  category: "Standard" | "Grande";
}

/** "cover" = immagine a piena pagina (con bleed, ritaglio se necessario). "contain" = immagine
 * adattata dentro il margine, ridimensionamento automatico, nessun ritaglio. */
export type FillMode = "cover" | "contain";

/** Margini per lato pagina. "inside" = verso il dorso/rilegatura, "outside" = verso il bordo
 * esterno: vengono specchiati automaticamente tra pagine destre (recto) e sinistre (verso). */
export interface PageMargins {
  topIn: number;
  bottomIn: number;
  insideIn: number;
  outsideIn: number;
}

/**
 * "continuous" = le pagine si susseguono senza interruzioni (comportamento classico).
 * "singleSidedWithFiller" = dopo ogni immagine viene inserita automaticamente una pagina di
 * riempimento (bianca o del colore scelto), per ottenere una stampa di fatto solo fronte con
 * il retro "neutro" — utile per evitare che pennarelli/pastelli passino sul disegno successivo.
 */
export type PrintMode = "continuous" | "singleSidedWithFiller";

export interface InteriorPage {
  id: string;
  kind: "image" | "blank" | "template";
  file?: File;
  /** Presente solo quando kind === "template". */
  templateId?: import("./templateLibrary").TemplateId;
  /** Seed per i template con contenuto generato casualmente (es. un puzzle Sudoku): stessa
   * pagina → stesso contenuto a ogni render (preview ed export coerenti), pagine diverse →
   * contenuto diverso. Presente solo quando kind === "template". */
  templateSeed?: number;
  name?: string;
  /** "default" = usa l'impostazione generale del documento. */
  fillModeOverride: FillMode | "default";
}
