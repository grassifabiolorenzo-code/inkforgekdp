/**
 * TOOL 6 — Blurb & Sinossi (Narrativa/Saggistica).
 *
 * Generazione primaria: AI (Lovable AI Gateway, vedi src/lib/aiCopy.server.ts),
 * multilingua secondo il selettore di lingua di output della piattaforma.
 * Motore a template locale mantenuto come fallback automatico e istantaneo
 * se l'AI non è disponibile (chiave mancante, rate limit, errore di rete):
 * il fallback resta in italiano, la generazione AI copre tutte le lingue.
 */

import { type AiToneId } from "@/components/tools/ai/aiStyle";

export type BookGenre =
  | "narrativa"
  | "thriller"
  | "fantasy"
  | "romance"
  | "saggistica"
  | "memoir"
  | "business";

export interface BlurbInput {
  title: string;
  genre: BookGenre;
  protagonist: string;
  setting: string;
  conflict: string;
  stakes: string;
  tone: AiToneId;
}

export interface BlurbOutput {
  hook: string;
  synopsis: string;
  editorialBlurb: string;
}

export const GENRES: { id: BookGenre; label: string }[] = [
  { id: "narrativa", label: "Narrativa generale" },
  { id: "thriller", label: "Thriller / Giallo" },
  { id: "fantasy", label: "Fantasy / Sci-Fi" },
  { id: "romance", label: "Romance" },
  { id: "saggistica", label: "Saggistica" },
  { id: "memoir", label: "Memoir / Biografia" },
  { id: "business", label: "Business / Self-help" },
];

function pick<T>(arr: T[]): T {
  // noUncheckedIndexedAccess: l'array è garantito non vuoto in tutti gli usi interni.
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const HOOK_OPENERS: Record<BookGenre, string[]> = {
  narrativa: ["C'è un momento, nella vita di {protagonist}, in cui tutto cambia.", "{protagonist} non lo sa ancora, ma la sua vita sta per essere riscritta."],
  thriller: ["Nessuno avrebbe scommesso su {protagonist}. Ed è proprio per questo che nessuno lo vede arrivare.", "Un errore. Una sola scelta sbagliata. Ed ecco che {protagonist} si ritrova senza via d'uscita."],
  fantasy: ["In un mondo dove {setting_or_default}, {protagonist} sta per scoprire chi è davvero.", "La leggenda dice che solo uno riuscirà a fermarlo. Nessuno immaginava che sarebbe stato {protagonist}."],
  romance: ["{protagonist} non stava cercando l'amore. È l'amore che l'ha trovata.", "Alcune storie iniziano con un incontro. Questa inizia con uno sbaglio."],
  saggistica: ["Cosa succederebbe se tutto quello che pensi di sapere su questo tema fosse sbagliato?", "{protagonist} affronta una domanda che in pochi hanno il coraggio di porsi."],
  memoir: ["Questa non è solo la storia di {protagonist}. È la storia di chi ha deciso di ricominciare.", "Ci sono verità che si scoprono solo guardando indietro. Questa è una di quelle."],
  business: ["La maggior parte delle persone fallisce per lo stesso, prevedibile motivo. {protagonist} lo sapeva, e ha scelto di fare diversamente.", "Non è un altro libro di teoria. È un metodo, testato sul campo da {protagonist}."],
};

const CONFLICT_CONNECTORS: Record<AiToneId, string[]> = {
  professionale: ["Il nodo centrale emerge quando {conflict}.", "La sfida diventa concreta nel momento in cui {conflict}."],
  amichevole: ["Ma quando {conflict}, ogni certezza vacilla.", "Tutto cambia quando {conflict}."],
  energico: ["E poi, all'improvviso, {conflict}. Non c'è tempo per pensare, solo per agire.", "Il ritmo si spezza in un istante: {conflict}."],
  caloroso: ["Poi, con dolcezza ma senza sconti, arriva il momento in cui {conflict}.", "È da {conflict} che nasce la parte più vera di questa storia."],
  autorevole: ["Il punto di svolta è netto: {conflict}.", "Non c'è ambiguità quando {conflict}."],
  giocoso: ["Ovviamente, come da copione, {conflict} — perché la vita non perde mai occasione.", "E naturalmente, proprio ora, {conflict}."],
};

const STAKES_LINES: Record<AiToneId, string[]> = {
  professionale: ["La posta in gioco è chiara: {stakes}.", "Ne va di {stakes}."],
  amichevole: ["In gioco c'è {stakes}, e non c'è modo di tirarsi indietro.", "Se fallisce, {stakes}. Non può permetterselo."],
  energico: ["In palio: {stakes}. Tutto o niente.", "Non c'è margine di errore: in gioco c'è {stakes}."],
  caloroso: ["Ma proprio in gioco c'è {stakes} — ed è questo a dare senso ad ogni passo.", "Vale la pena rischiare, quando in gioco c'è {stakes}."],
  autorevole: ["Il rischio concreto è {stakes}.", "L'esito, se le cose andassero male, sarebbe {stakes}."],
  giocoso: ["Poca roba, eh: solo {stakes}.", "Nel peggiore dei casi si perde solo {stakes}. Nessuna pressione."],
};

const CLOSING_LINES: Record<AiToneId, string[]> = {
  professionale: ["Un testo di riferimento per chi vuole affrontare il tema con metodo.", "Chiaro, concreto, costruito per restare."],
  amichevole: ["Un libro che non si lascia più, dalla prima all'ultima pagina.", "Preparati a non staccare gli occhi dalle pagine."],
  energico: ["Un ritmo che non lascia respiro, fino all'ultima riga.", "Serrato, imprevedibile, da leggere tutto d'un fiato."],
  caloroso: ["Una lettura che resta, molto dopo l'ultima pagina.", "Una storia che si prende cura di chi legge."],
  autorevole: ["Un lavoro solido, costruito con precisione e rigore.", "Un riferimento per chi cerca sostanza, non promesse vuote."],
  giocoso: ["Con una buona dose di ironia, perché prendersi troppo sul serio non serve a nessuno.", "Un mix di leggerezza e sostanza che non ti aspetti."],
};

const EDITORIAL_TEMPLATES: string[] = [
  "«{title} è la lettura che non sapevi di aspettare.»",
  "«Un {genreLabel} scritto con mano sicura: {title} colpisce dritto al cuore.»",
  "«{title} si legge d'un fiato — e si ricorda a lungo.»",
  "«Con {title}, {protagonist} conquista il lettore fin dalle prime righe.»",
];

function fillTemplate(template: string, input: BlurbInput, genreLabel: string) {
  return template
    .replaceAll("{protagonist}", input.protagonist || "il protagonista")
    .replaceAll("{setting_or_default}", input.setting || "nulla è come sembra")
    .replaceAll("{conflict}", (input.conflict || "tutto cambia improvvisamente").charAt(0).toLowerCase() + (input.conflict || "tutto cambia improvvisamente").slice(1))
    .replaceAll("{stakes}", input.stakes || "molto più di quanto immagini")
    .replaceAll("{title}", input.title || "questo libro")
    .replaceAll("{genreLabel}", genreLabel.toLowerCase());
}

/** Fallback locale (solo italiano), usato automaticamente se l'AI non è disponibile. */
export function generateBlurbLocal(input: BlurbInput): BlurbOutput {
  const genreLabel = GENRES.find((g) => g.id === input.genre)?.label ?? "libro";

  const hook = fillTemplate(pick(HOOK_OPENERS[input.genre]), input, genreLabel);

  const synopsisParts = [
    hook,
    fillTemplate(pick(CONFLICT_CONNECTORS[input.tone]), input, genreLabel),
    input.stakes.trim() ? fillTemplate(pick(STAKES_LINES[input.tone]), input, genreLabel) : "",
    pick(CLOSING_LINES[input.tone]),
  ].filter(Boolean);

  const editorialBlurb = fillTemplate(pick(EDITORIAL_TEMPLATES), input, genreLabel);

  return {
    hook,
    synopsis: synopsisParts.join(" "),
    editorialBlurb,
  };
}

export function formatBlurbForExport(input: BlurbInput, output: BlurbOutput): string {
  return [
    `=== BLURB & SINOSSI — ${input.title || "Titolo libro"} ===`,
    "",
    "--- Hook / Prima riga ---",
    output.hook,
    "",
    "--- Sinossi / Quarta di copertina ---",
    output.synopsis,
    "",
    "--- Editorial blurb ---",
    output.editorialBlurb,
  ].join("\n");
}
