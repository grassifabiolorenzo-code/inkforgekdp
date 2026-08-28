/**
 * Configurazione centralizzata dei 4 tool.
 * `creditEvent` documenta l'unico evento che consuma 1 credito.
 * Nessun componente deve duplicare questa configurazione.
 */

export type ToolId = "copertine" | "pubblicazione" | "aplus" | "triage";

export interface ToolConfig {
  id: ToolId;
  slot: 1 | 2 | 3 | 4;
  name: string;
  /** Rotta della dashboard (modulo indipendente). */
  route: string;
  icon: "image" | "file-text" | "sparkles" | "layers";
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
      "Costruttore di contenuti A+ multilingua a partire dal tuo PDF, con moduli e immagini pronte.",
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
];

export const getTool = (id: string): ToolConfig | undefined => TOOLS.find((t) => t.id === id);

export const getToolBySlot = (slot: number): ToolConfig | undefined =>
  TOOLS.find((t) => t.slot === slot);
