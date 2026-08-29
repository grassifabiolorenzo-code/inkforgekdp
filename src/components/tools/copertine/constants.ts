import type { PaperType, TrimId } from "./types";

/** Formati libro KDP (trim size) supportati, in pollici. */
export const KDP_TRIM_SIZES: { id: TrimId; label: string; w: number; h: number }[] = [
  { id: "8.5x11", label: '8.5" x 11" (Quaderni / Coloring)', w: 8.5, h: 11 },
  { id: "6x9", label: '6" x 9" (Saggistica / Narrativa)', w: 6, h: 9 },
  { id: "8.25x11", label: '8.25" x 11" (Album / Spartiti)', w: 8.25, h: 11 },
  { id: "8.5x8.5", label: '8.5" x 8.5" (Quadrato)', w: 8.5, h: 8.5 },
];

/** Spessore carta in pollici per pagina, secondo le specifiche KDP. */
export const KDP_PAPER_THICKNESS: Record<PaperType, number> = {
  white: 0.002252,
  cream: 0.0025,
  color: 0.002347,
};

export const KDP_PAPER_LABELS: Record<PaperType, string> = {
  white: 'Bianca (0.002252")',
  cream: 'Crema (0.0025")',
  color: 'Colore (0.002347")',
};

/** Abbondanza (bleed) e margine di sicurezza KDP, in pollici. */
export const KDP_BLEED_IN = 0.125;
export const KDP_SAFE_MARGIN_IN = 0.25;
export const EXPORT_DPI = 300;

export const FX_EFFECTS: { id: "fx-none" | "fx-outline" | "fx-glow" | "fx-shadow"; label: string }[] = [
  { id: "fx-none", label: "Normale" },
  { id: "fx-outline", label: "Contorno Nero" },
  { id: "fx-glow", label: "Glow Brillante" },
  { id: "fx-shadow", label: "Ombra 3D" },
];

export const FONTS_DATABASE = [
  "Inter",
  "Montserrat",
  "Poppins",
  "Cinzel",
  "Bebas Neue",
  "Oswald",
  "Playfair Display",
  "Dancing Script",
  "Great Vibes",
  "Pacifico",
  "Caveat",
  "Creepster",
  "Orbitron",
  "Fira Code",
  "Cormorant Garamond",
  "Lora",
  "Roboto Slab",
  "Bungee",
  "Luckiest Guy",
  "Fredoka One",
  "Russo One",
  "Righteous",
  "Satisfy",
  "VT323",
  "Jost",
];

export const PALETTES = [
  { id: "violet", label: "Violet Studio", from: "#7c3aed", to: "#22c55e" },
  { id: "midnight", label: "Midnight", from: "#0f172a", to: "#4338ca" },
  { id: "amber", label: "Amber Press", from: "#111827", to: "#f59e0b" },
  { id: "rose", label: "Rose Noir", from: "#1f2937", to: "#e11d48" },
  { id: "ocean", label: "Ocean Deep", from: "#083344", to: "#06b6d4" },
];

export const PREVIEW_MAX_WIDTH = 900;
