export type TrimSizeId = "8.5x11" | "6x9" | "8.25x11" | "8.5x8.5";

export interface TrimSizeSpec {
  id: TrimSizeId;
  label: string;
  widthIn: number;
  heightIn: number;
}

/** "cover" = immagine a piena pagina (con bleed, ritaglio se necessario). "contain" = immagine
 * adattata dentro il margine, ridimensionamento automatico, nessun ritaglio. */
export type FillMode = "cover" | "contain";

export interface InteriorPage {
  id: string;
  kind: "image" | "blank";
  file?: File;
  name?: string;
  /** "default" = usa l'impostazione generale del documento. */
  fillModeOverride: FillMode | "default";
}
