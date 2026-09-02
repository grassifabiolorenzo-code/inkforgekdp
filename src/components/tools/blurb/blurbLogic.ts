/**
 * TOOL 6 — Blurb & Sinossi (Narrativa/Saggistica).
 *
 * Generazione primaria: AI (Lovable AI Gateway, vedi src/lib/aiCopy.server.ts),
 * multilingua secondo il selettore di lingua di output della piattaforma.
 * Motore a template locale mantenuto come fallback automatico e istantaneo
 * se l'AI non è disponibile (chiave mancante, rate limit, errore di rete):
 * copre le stesse 7 lingue di output della piattaforma (vedi blurbLocales.ts),
 * non solo l'italiano.
 */

import { type AiToneId } from "@/components/tools/ai/aiStyle";
import { BLURB_LOCALE_PACKS, type BlurbLocale } from "./blurbLocales";

export type BookGenre =
  "narrativa" | "thriller" | "fantasy" | "romance" | "saggistica" | "memoir" | "business";

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

function fillTemplate(
  template: string,
  input: BlurbInput,
  defaults: (typeof BLURB_LOCALE_PACKS)["it"]["defaults"],
) {
  const conflictText = input.conflict || defaults.conflict;
  return template
    .replaceAll("{protagonist}", input.protagonist || defaults.protagonist)
    .replaceAll("{setting_or_default}", input.setting || defaults.setting)
    .replaceAll("{conflict}", conflictText.charAt(0).toLowerCase() + conflictText.slice(1))
    .replaceAll("{stakes}", input.stakes || defaults.stakes)
    .replaceAll("{title}", input.title || defaults.title);
}

/**
 * Fallback a template, usato automaticamente se l'AI non è disponibile. Copre
 * le stesse 7 lingue di output della piattaforma (vedi blurbLocales.ts) — non
 * ripiega più sempre sull'italiano indipendentemente dalla lingua richiesta.
 */
export function generateBlurbLocal(input: BlurbInput, locale: string = "it"): BlurbOutput {
  const pack =
    BLURB_LOCALE_PACKS[
      (locale as BlurbLocale) in BLURB_LOCALE_PACKS ? (locale as BlurbLocale) : "it"
    ];

  const hook = fillTemplate(pick(pack.hookOpeners[input.genre]), input, pack.defaults);

  const synopsisParts = [
    hook,
    fillTemplate(pick(pack.conflictConnectors[input.tone]), input, pack.defaults),
    input.stakes.trim()
      ? fillTemplate(pick(pack.stakesLines[input.tone]), input, pack.defaults)
      : "",
    pick(pack.closingLines[input.tone]),
  ].filter(Boolean);

  const editorialBlurb = fillTemplate(pick(pack.editorialTemplates), input, pack.defaults);

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
