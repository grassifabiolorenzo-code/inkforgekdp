/**
 * Impostazioni di stile condivise dai tool AI (Pubblicazione e A+ KDPstudio):
 * tono di voce e livello di creatività.
 */

export const AI_TONES = [
  { id: "professionale", label: "Professionale" },
  { id: "amichevole", label: "Amichevole" },
  { id: "energico", label: "Energico" },
  { id: "caloroso", label: "Caloroso / familiare" },
  { id: "autorevole", label: "Autorevole / esperto" },
  { id: "giocoso", label: "Giocoso" },
] as const;

export type AiToneId = (typeof AI_TONES)[number]["id"];

export const DEFAULT_TONE: AiToneId = "amichevole";
/** 1 = molto aderente ai contenuti, 10 = massima libertà creativa. */
export const DEFAULT_CREATIVITY = 5;

export function toneLabel(id: string): string {
  return AI_TONES.find((t) => t.id === id)?.label ?? id;
}
