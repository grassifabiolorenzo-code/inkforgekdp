/**
 * TOOL 7 — Bio Autore & Kit Stampa.
 *
 * Generazione primaria: AI (Lovable AI Gateway), multilingua secondo il
 * selettore di lingua di output della piattaforma. Motore a template locale
 * mantenuto come fallback automatico se l'AI non è disponibile: copre le
 * stesse 7 lingue di output della piattaforma (vedi bioLocales.ts), non solo
 * l'italiano.
 */

import { type AiToneId } from "@/components/tools/ai/aiStyle";
import { BIO_LOCALE_PACKS, type BioLocale } from "./bioLocales";

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

function fill(template: string, i: BioInput, pack: (typeof BIO_LOCALE_PACKS)["it"]) {
  return template
    .replaceAll("{name}", i.authorName || pack.defaults.name)
    .replaceAll("{niche}", i.niche || pack.defaults.niche)
    .replaceAll("{niche_lower}", (i.niche || pack.defaults.niche).toLowerCase())
    .replaceAll("{achievements}", i.achievements)
    .replaceAll("{personal}", i.personalTouch);
}

/**
 * Fallback a template, usato automaticamente se l'AI non è disponibile. Copre
 * le stesse 7 lingue di output della piattaforma (vedi bioLocales.ts) — non
 * ripiega più sempre sull'italiano indipendentemente dalla lingua richiesta.
 */
export function generateBioLocal(input: BioInput, locale: string = "it"): BioOutput {
  const pack =
    BIO_LOCALE_PACKS[(locale as BioLocale) in BIO_LOCALE_PACKS ? (locale as BioLocale) : "it"];

  const opener = fill(pick(pack.openers[input.tone]), input, pack);
  const achievementLine = input.achievements.trim()
    ? fill(pick(pack.achievementLines[input.tone]), input, pack)
    : "";
  const personalLine = input.personalTouch.trim()
    ? fill(pick(pack.personalLines[input.tone]), input, pack)
    : "";
  const closer = fill(pick(pack.closers[input.tone]), input, pack);
  const linksLine = input.links.trim() ? `${pack.moreInfoLabel} ${input.links}.` : "";

  const shortBio = [opener].join(" ").slice(0, 180);

  const mediumParts = [opener, achievementLine, closer].filter(Boolean);
  const mediumBio = mediumParts.join(" ");

  const longParts = [opener, achievementLine, personalLine, closer, linksLine].filter(Boolean);
  const longBio = longParts.join(" ");

  const pr = pack.pressRelease;
  const releaseLine = input.releaseInfo ? `${pr.releaseLabel}: ${input.releaseInfo}` : pr.immediate;
  const pressRelease = [
    `${pr.header} — ${releaseLine}`,
    "",
    pr.announce(input.bookTitle || pr.newBookDefault, input.authorName || pr.authorDefault),
    "",
    longBio,
    "",
    input.bookTitle ? pr.availableFormat(input.bookTitle, input.links) : "",
    "",
    pr.pressContact,
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
