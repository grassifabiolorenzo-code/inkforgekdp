/**
 * Pannello di controllo SEO/KDP: conteggi caratteri, check di conformità
 * alle regole Amazon KDP e suggerimenti keyword long-tail.
 * Logica pura, così da poter essere usata prima di copiare o esportare.
 */

import type { Listing } from "./listingLogic";

export const KDP_LIMITS = {
  title: 200,
  subtitle: 200,
  description: 4000,
  keyword: 50,
  /** Lunghezza consigliata (non obbligatoria) del titolo visibile in ricerca. */
  titleRecommended: 60,
  subtitleRecommended: 180,
  descriptionMin: 1200,
} as const;

export type CheckLevel = "ok" | "warn" | "error";

export interface SeoCheck {
  id: string;
  label: string;
  level: CheckLevel;
  detail: string;
}

/** Termini promozionali vietati nei metadati Amazon KDP. */
const FORBIDDEN_TERMS = [
  "bestseller",
  "best seller",
  "best-seller",
  "gratis",
  "free",
  "sconto",
  "offerta",
  "sale",
  "regalo gratuito",
  "amazon",
  "kindle unlimited",
  "recensioni a 5 stelle",
  "5 stelle",
];

const STOPWORDS = new Set([
  "il","lo","la","i","gli","le","un","uno","una","di","a","da","in","con","su","per","tra","fra","e","ed","o","che","non","del","della","dei","delle","al","alla","ai","alle","nel","nella","dal","come","più","anche","ogni","questo","questa","sono","essere","the","and","for","with","your","you","this","that","from","are","was","its","their","have","has","will","can","all","not","but","kids","of","to","in","on","a","an",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Suggerimenti keyword long-tail estratti dai testi reali del listing. */
export function suggestKeywords(listing: Listing, subject: string, limit = 8): string[] {
  const source = `${subject} ${listing.title} ${listing.subtitle} ${listing.description}`;
  const tokens = words(source);
  const counts = new Map<string, number>();

  // Bigrammi e trigrammi: base delle keyword long-tail.
  for (let n = 2; n <= 3; n += 1) {
    for (let i = 0; i + n <= tokens.length; i += 1) {
      const phrase = tokens.slice(i, i + n).join(" ");
      if (phrase.length < 8 || phrase.length > KDP_LIMITS.keyword) continue;
      counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
    }
  }

  const existing = new Set(listing.keywords.map((k) => k.trim().toLowerCase()));
  return [...counts.entries()]
    .filter(([phrase, count]) => count > 1 && !existing.has(phrase))
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, limit)
    .map(([phrase]) => phrase);
}

function findForbidden(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN_TERMS.filter((term) => lower.includes(term));
}

/** Check di conformità KDP su titolo, sottotitolo, descrizione e keyword. */
export function auditListing(listing: Listing): SeoCheck[] {
  const checks: SeoCheck[] = [];
  const title = listing.title.trim();
  const subtitle = listing.subtitle.trim();
  const description = listing.description.trim();

  checks.push(
    title.length === 0
      ? { id: "title", label: "Titolo", level: "error", detail: "Il titolo è obbligatorio." }
      : title.length > KDP_LIMITS.title
        ? { id: "title", label: "Titolo", level: "error", detail: `${title.length} caratteri: supera il limite KDP di ${KDP_LIMITS.title}.` }
        : title.length > KDP_LIMITS.titleRecommended
          ? { id: "title", label: "Titolo", level: "warn", detail: `${title.length} caratteri: oltre ${KDP_LIMITS.titleRecommended} rischia il troncamento nei risultati di ricerca.` }
          : { id: "title", label: "Titolo", level: "ok", detail: `${title.length} caratteri: lunghezza ottimale.` },
  );

  checks.push(
    subtitle.length === 0
      ? { id: "subtitle", label: "Sottotitolo", level: "warn", detail: "Sottotitolo vuoto: perdi spazio keyword indicizzabile." }
      : subtitle.length > KDP_LIMITS.subtitle
        ? { id: "subtitle", label: "Sottotitolo", level: "error", detail: `${subtitle.length} caratteri: supera il limite di ${KDP_LIMITS.subtitle}.` }
        : { id: "subtitle", label: "Sottotitolo", level: "ok", detail: `${subtitle.length} caratteri.` },
  );

  checks.push(
    description.length > KDP_LIMITS.description
      ? { id: "description", label: "Descrizione", level: "error", detail: `${description.length} caratteri: supera il limite di ${KDP_LIMITS.description}.` }
      : description.length < KDP_LIMITS.descriptionMin
        ? { id: "description", label: "Descrizione", level: "warn", detail: `${description.length} caratteri: sotto ${KDP_LIMITS.descriptionMin} converte meno.` }
        : { id: "description", label: "Descrizione", level: "ok", detail: `${description.length} caratteri: lunghezza efficace.` },
  );

  // Keyword: 7 box, max 50 caratteri, nessun duplicato, nessuna ripetizione del titolo.
  const filled = listing.keywords.map((k) => k.trim()).filter(Boolean);
  const tooLong = filled.filter((k) => k.length > KDP_LIMITS.keyword);
  const lowered = filled.map((k) => k.toLowerCase());
  const duplicates = lowered.filter((k, i) => lowered.indexOf(k) !== i);
  const inTitle = filled.filter((k) => title.toLowerCase().includes(k.toLowerCase()));

  checks.push(
    filled.length < 7
      ? { id: "kw-count", label: "Keyword compilate", level: "warn", detail: `${filled.length}/7 box usati: compila tutti i campi.` }
      : { id: "kw-count", label: "Keyword compilate", level: "ok", detail: "Tutti e 7 i box sono compilati." },
  );

  if (tooLong.length) {
    checks.push({ id: "kw-length", label: "Lunghezza keyword", level: "error", detail: `${tooLong.length} keyword superano ${KDP_LIMITS.keyword} caratteri.` });
  } else if (filled.length) {
    checks.push({ id: "kw-length", label: "Lunghezza keyword", level: "ok", detail: `Massimo rilevato: ${Math.max(...filled.map((k) => k.length))} caratteri.` });
  }

  if (duplicates.length) {
    checks.push({ id: "kw-dup", label: "Keyword duplicate", level: "error", detail: `Duplicati: ${[...new Set(duplicates)].join(", ")}.` });
  }
  if (inTitle.length) {
    checks.push({ id: "kw-title", label: "Keyword già nel titolo", level: "warn", detail: `${inTitle.length} keyword ripetono il titolo: spazio sprecato.` });
  }

  const forbidden = findForbidden(`${title} ${subtitle} ${description} ${filled.join(" ")}`);
  checks.push(
    forbidden.length
      ? { id: "forbidden", label: "Termini vietati", level: "error", detail: `Rimuovi: ${[...new Set(forbidden)].join(", ")}.` }
      : { id: "forbidden", label: "Termini vietati", level: "ok", detail: "Nessun claim promozionale non consentito." },
  );

  checks.push(
    /<[a-z][\s\S]*>/i.test(description)
      ? { id: "html", label: "HTML nella descrizione", level: "warn", detail: "Tag HTML rilevati: verificane il supporto in KDP." }
      : { id: "html", label: "HTML nella descrizione", level: "ok", detail: "Testo pulito, nessun tag." },
  );

  const categories = listing.categories.map((c) => c.trim()).filter(Boolean);
  checks.push(
    categories.length < 3
      ? { id: "categories", label: "Categorie BISAC", level: "warn", detail: `${categories.length}/3 categorie compilate.` }
      : { id: "categories", label: "Categorie BISAC", level: "ok", detail: "3 categorie pronte." },
  );

  return checks;
}

/** Punteggio sintetico 0-100 basato sui check. */
export function auditScore(checks: SeoCheck[]): number {
  if (!checks.length) return 0;
  const penalty = checks.reduce((sum, c) => sum + (c.level === "error" ? 14 : c.level === "warn" ? 6 : 0), 0);
  return Math.max(0, 100 - penalty);
}
