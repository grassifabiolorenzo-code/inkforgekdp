/**
 * Configurazione centralizzata degli 8 tool.
 * `creditEvent` documenta l'unico evento che consuma 1 credito.
 * Nessun componente deve duplicare questa configurazione.
 */

export type ToolId =
  "copertine" | "pubblicazione" | "aplus" | "triage" | "interni" | "blurb" | "bio" | "promo";

export interface ToolConfig {
  id: ToolId;
  slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  name: string;
  /** Rotta della dashboard (modulo indipendente). */
  route: string;
  icon:
    | "image"
    | "file-text"
    | "sparkles"
    | "layers"
    | "layout-grid"
    | "book-open"
    | "user"
    | "megaphone";
  description: string;
  benefit: string;
  /** Evento che consuma il credito (etichetta UI). */
  creditEvent: string;
  /** Azione tecnica che scala il credito lato server. */
  creditAction: string;
  cost: number;
}

export const TOOLS: ToolConfig[] = [
  {
    id: "copertine",
    slot: 1,
    name: "Copertine",
    route: "/dashboard/tool-1",
    icon: "image",
    description:
      "Editor di copertine KDP con guide bleed, dorso e margini di sicurezza, testi e effetti tipografici.",
    benefit: "Copertine pronte per KDP senza software esterni, con export in alta risoluzione.",
    creditEvent: "Esportazione immagine completata",
    creditAction: "export_completed",
    cost: 1,
  },
  {
    id: "pubblicazione",
    slot: 2,
    name: "Pubblicazione",
    route: "/dashboard/tool-2",
    icon: "file-text",
    description:
      "Generatore di listing KDP: titolo, sottotitolo, descrizione, keyword e categorie ottimizzate.",
    benefit: "Schede prodotto complete e conformi in pochi secondi, pronte da incollare su KDP.",
    creditEvent: "Ogni generazione completata",
    creditAction: "generation_completed",
    cost: 1,
  },
  {
    id: "aplus",
    slot: 3,
    name: "A+ KDPstudio",
    route: "/dashboard/tool-3",
    icon: "sparkles",
    description:
      "Costruttore di contenuti A+ multilingua a partire dal tuo PDF: moduli pronti con le tue pagine reali di copertina e interno.",
    benefit: "Contenuti A+ professionali e multilingua senza designer.",
    creditEvent: "Ogni generazione completata",
    creditAction: "generation_completed",
    cost: 1,
  },
  {
    id: "triage",
    slot: 4,
    name: "Triage",
    route: "/dashboard/tool-4",
    icon: "layers",
    description:
      "Analisi rapida delle immagini per KDP: DPI, dimensioni, qualità e smistamento automatico.",
    benefit: "Scarti le immagini inutilizzabili prima dell'impaginazione e risparmi ore di lavoro.",
    creditEvent: "Download completato delle 3 cartelle",
    creditAction: "download_completed",
    cost: 1,
  },
  {
    id: "interni",
    slot: 5,
    name: "Interni",
    route: "/dashboard/tool-5",
    icon: "layout-grid",
    description:
      "Impaginatore per gli interni del libro: carica le immagini, imposta formato KDP, margini e bleed, ed esporta un PDF interno unico pronto per la stampa.",
    benefit:
      "Un unico PDF interno pronto per KDP, senza passare da altri programmi di impaginazione.",
    creditEvent: "Ogni PDF interno generato con successo",
    creditAction: "generation_completed",
    cost: 1,
  },
  {
    id: "blurb",
    slot: 6,
    name: "Blurb & Sinossi",
    route: "/dashboard/tool-6",
    icon: "book-open",
    description:
      "Genera quarta di copertina, sinossi ed editorial blurb per narrativa e saggistica, in qualsiasi genere e tono.",
    benefit:
      "Testi di vendita pronti per libri di narrativa e saggistica, non solo coloring e activity book.",
    creditEvent: "Ogni generazione completata",
    creditAction: "generation_completed",
    cost: 1,
  },
  {
    id: "bio",
    slot: 7,
    name: "Bio Autore & Kit Stampa",
    route: "/dashboard/tool-7",
    icon: "user",
    description:
      "Genera bio autore (breve, media, lunga) per Amazon Author Central e siti, più comunicato stampa di lancio libro.",
    benefit:
      "Presentati in modo professionale su Amazon, sito e stampa senza scrivere da zero ogni volta.",
    creditEvent: "Ogni generazione completata",
    creditAction: "generation_completed",
    cost: 1,
  },
  {
    id: "promo",
    slot: 8,
    name: "Social & Ads Promo Kit",
    route: "/dashboard/tool-8",
    icon: "megaphone",
    description:
      "Genera post social multi-piattaforma, headline/bullet per Amazon Ads ed email di lancio per promuovere il libro.",
    benefit:
      "Materiale di lancio pronto in pochi secondi, coerente su tutti i canali di promozione.",
    creditEvent: "Ogni generazione completata",
    creditAction: "generation_completed",
    cost: 1,
  },
];

export const getTool = (id: string): ToolConfig | undefined => TOOLS.find((t) => t.id === id);

export const getToolBySlot = (slot: number): ToolConfig | undefined =>
  TOOLS.find((t) => t.slot === slot);

/** Tool disponibile solo nei piani Pro e Business. */
export const isToolRestricted = (id: string) => id === "aplus";
