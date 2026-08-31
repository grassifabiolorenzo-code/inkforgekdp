/**
 * TOOL 7 — Bio Autore & Kit Stampa.
 *
 * Generazione primaria: AI (Lovable AI Gateway), multilingua secondo il
 * selettore di lingua di output della piattaforma. Motore a template locale
 * mantenuto come fallback automatico se l'AI non è disponibile (resta in
 * italiano; la generazione AI copre tutte le lingue supportate).
 */

import { type AiToneId } from "@/components/tools/ai/aiStyle";

export interface BioInput {
  authorName: string;
  niche: string;
  achievements: string;
  personalTouch: string;
  tone: AiToneId;
  bookTitle: string;
  releaseInfo: string;
  links: string;
}

export interface BioOutput {
  shortBio: string;
  mediumBio: string;
  longBio: string;
  pressRelease: string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const OPENERS: Record<AiToneId, string[]> = {
  professionale: ["{name} è {niche}.", "{name} si occupa di {niche}."],
  amichevole: ["{name} è, semplicemente, {niche} — e adora ogni minuto di questo lavoro.", "Ciao, sono {name}: {niche}, per passione prima ancora che per mestiere."],
  energico: ["{name} è {niche}, con un ritmo di lavoro che non si ferma mai.", "{name} vive {niche_lower} con energia contagiosa."],
  caloroso: ["{name} è {niche}, con uno sguardo sempre attento a chi legge.", "{name} racconta {niche_lower} con calore e vicinanza."],
  autorevole: ["{name} è un/una punto di riferimento in materia di {niche_lower}.", "{name} porta anni di esperienza in {niche_lower}."],
  giocoso: ["{name} è {niche}. O almeno, questo è quello che scrive nelle bio ufficiali.", "{name} fa {niche} di mestiere, e sopravvive a base di caffè e scadenze."],
};

const ACHIEVEMENT_LINES: Record<AiToneId, string[]> = {
  professionale: ["Il suo percorso include {achievements}.", "Tra i suoi risultati: {achievements}."],
  amichevole: ["Nel suo percorso c'è spazio anche per {achievements} — con più soddisfazione che vanto.", "Ha avuto la fortuna di vivere {achievements}."],
  energico: ["Un percorso fatto di risultati concreti: {achievements}.", "Ha già raggiunto traguardi importanti, tra cui {achievements}."],
  caloroso: ["Con impegno e costanza è arrivato/a a {achievements}.", "Un cammino fatto anche di {achievements}, vissuto con gratitudine."],
  autorevole: ["Tra i suoi risultati più rilevanti: {achievements}.", "Il suo curriculum comprende {achievements}."],
  giocoso: ["Vanta anche {achievements}, anche se preferisce non farne un gran parlare (mentendo un po').", "Tra i trofei da esibire: {achievements}."],
};

const PERSONAL_LINES: Record<AiToneId, string[]> = {
  professionale: ["Nel tempo libero, {personal}.", "Fuori dal lavoro, {personal}."],
  amichevole: ["Quando non scrive, probabilmente {personal}.", "A parte questo, {personal} — e ne va fiero/a."],
  energico: ["Nei ritagli di tempo, {personal}.", "Anche fuori dal lavoro non si ferma: {personal}."],
  caloroso: ["Nella vita di tutti i giorni, {personal}.", "Tiene molto anche al fatto che {personal}."],
  autorevole: ["Al di fuori dell'attività professionale, {personal}.", "Coltiva anche altri interessi: {personal}."],
  giocoso: ["Nel tempo libero (quello che rimane) {personal}.", "Confessa candidamente che {personal}."],
};

const CLOSERS: Record<AiToneId, string[]> = {
  professionale: ["Continua a lavorare con dedizione al proprio percorso professionale.", "Porta avanti il proprio lavoro con rigore e costanza."],
  amichevole: ["Ama restare in contatto con chi legge le sue opere.", "Non vede l'ora di condividere il prossimo capitolo di questa avventura."],
  energico: ["Non ha intenzione di rallentare: il prossimo progetto è già in cantiere.", "Continua a spingere sull'acceleratore, un progetto dopo l'altro."],
  caloroso: ["Crede fermamente che ogni storia meriti di essere raccontata con cura.", "Continua il proprio cammino con la convinzione che ogni passo conti."],
  autorevole: ["Continua a portare rigore e competenza in tutto ciò che fa.", "Rimane un punto di riferimento affidabile nel proprio ambito."],
  giocoso: ["Promette di continuare finché qualcuno avrà voglia di leggerlo/a.", "Nel frattempo, continua a scrivere — ovviamente."],
};

function fill(template: string, i: BioInput) {
  return template
    .replaceAll("{name}", i.authorName || "L'autore")
    .replaceAll("{niche}", i.niche || "scrittore/scrittrice")
    .replaceAll("{niche_lower}", (i.niche || "scrittura").toLowerCase())
    .replaceAll("{achievements}", i.achievements)
    .replaceAll("{personal}", i.personalTouch);
}

/** Fallback locale (solo italiano), usato automaticamente se l'AI non è disponibile. */
export function generateBioLocal(input: BioInput): BioOutput {
  const opener = fill(pick(OPENERS[input.tone]), input);
  const achievementLine = input.achievements.trim() ? fill(pick(ACHIEVEMENT_LINES[input.tone]), input) : "";
  const personalLine = input.personalTouch.trim() ? fill(pick(PERSONAL_LINES[input.tone]), input) : "";
  const closer = fill(pick(CLOSERS[input.tone]), input);
  const linksLine = input.links.trim() ? `Per saperne di più: ${input.links}.` : "";

  const shortBio = [opener].join(" ").slice(0, 180);

  const mediumParts = [opener, achievementLine, closer].filter(Boolean);
  const mediumBio = mediumParts.join(" ");

  const longParts = [opener, achievementLine, personalLine, closer, linksLine].filter(Boolean);
  const longBio = longParts.join(" ");

  const pressRelease = [
    `COMUNICATO STAMPA — ${input.releaseInfo ? `Uscita: ${input.releaseInfo}` : "Per pubblicazione immediata"}`,
    "",
    `"${input.bookTitle || "Nuovo libro"}", il nuovo lavoro di ${input.authorName || "l'autore"}, è ora disponibile.`,
    "",
    longBio,
    "",
    input.bookTitle
      ? `"${input.bookTitle}" è disponibile su Amazon in formato cartaceo${input.links ? ` — maggiori informazioni su ${input.links}` : ""}.`
      : "",
    "",
    "Per richieste stampa, interviste o materiale aggiuntivo, contattare l'autore direttamente.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return { shortBio, mediumBio, longBio, pressRelease };
}

export function formatBioForExport(input: BioInput, output: BioOutput): string {
  return [
    `=== BIO AUTORE & KIT STAMPA — ${input.authorName || "Autore"} ===`,
    "",
    `--- Bio breve (${output.shortBio.length} caratteri) ---`,
    output.shortBio,
    "",
    `--- Bio media (${output.mediumBio.length} caratteri) ---`,
    output.mediumBio,
    "",
    `--- Bio lunga (${output.longBio.length} caratteri) ---`,
    output.longBio,
    "",
    "--- Comunicato stampa ---",
    output.pressRelease,
  ].join("\n");
}
