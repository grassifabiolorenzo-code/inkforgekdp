import { COPY_VARIATION_BANK, MULTI_LANG_DATABASE } from "./constants";
import type { AgeId, GeneratedModulesText, LangId, NicheCopy, NicheId } from "./types";

function cloneCopy(copy: NicheCopy): NicheCopy {
  return JSON.parse(JSON.stringify(copy)) as NicheCopy;
}

let variationCursor = -1;
/** Ruota la variazione di copy ad ogni generazione, come il contatore in localStorage dell'app originale. */
export function nextCopyVariationIndex(): number {
  if (typeof window === "undefined") return 0;
  const key = "aplus_copy_variation_index_v2";
  const stored = Number.parseInt(window.localStorage.getItem(key) ?? "-1", 10);
  const base = Number.isFinite(stored) ? stored : variationCursor;
  const index = (base + 1) % 5;
  window.localStorage.setItem(key, String(index));
  variationCursor = index;
  return index;
}

export function applyCopyVariation(baseCopy: NicheCopy, lang: LangId, variationIndex: number): NicheCopy {
  const copy = cloneCopy(baseCopy);
  const bank = COPY_VARIATION_BANK[lang] ?? COPY_VARIATION_BANK.it;
  const v = bank[variationIndex % bank.length]!;

  if (copy.hero) {
    copy.hero.headline = v.heroLead;
    copy.hero.body = `${copy.hero.body}${v.bodyTail}`;
    copy.hero.alt = `${copy.hero.alt}${v.altTail}`;
  }
  if (copy.proof) {
    copy.proof.headline = v.proofLead;
    copy.proof.body = `${copy.proof.body}${v.bodyTail}`;
    copy.proof.alt = `${copy.proof.alt}${v.altTail}`;
  }
  if (copy.value) {
    copy.value.text1 = `${copy.value.text1} · ${v.gridLead}`;
    copy.value.text2 = `${copy.value.text2} · ${v.gridLead}`;
    copy.value.text3 = `${copy.value.text3} · ${v.gridLead}`;
    copy.value.alt = `${copy.value.alt}${v.altTail}`;
  }
  if (Array.isArray(copy.grid)) {
    copy.grid = copy.grid.map((item, i) => ({
      ...item,
      title: i === 0 ? v.gridLead : item.title,
      desc: `${item.desc} ${v.bodyTail.trim()}`,
    }));
  }
  if (typeof copy.comp === "string") {
    copy.comp = `${copy.comp} ${v.bodyTail.trim()}`;
  }
  if (copy.ageDynamic) {
    for (const age of Object.keys(copy.ageDynamic) as AgeId[]) {
      const ageCopy = copy.ageDynamic[age];
      if (!ageCopy) continue;
      ageCopy.heroTitle = `${v.heroLead} — ${ageCopy.heroTitle}`;
      ageCopy.heroBody = `${ageCopy.heroBody}${v.bodyTail}`;
      ageCopy.proofTitle = `${v.proofLead} — ${ageCopy.proofTitle}`;
      ageCopy.proofBody = `${ageCopy.proofBody}${v.bodyTail}`;
    }
  }
  return copy;
}

export interface GenerateTextsParams {
  lang: LangId;
  niche: NicheId;
  age: AgeId;
  pages: [number, number, number];
  variationIndex: number;
}

/** Costruisce i testi dei 5 moduli A+ replicando la logica multilingua/età dell'app originale. */
export function generateModulesText({ lang, niche, age, pages, variationIndex }: GenerateTextsParams): GeneratedModulesText {
  const langData = MULTI_LANG_DATABASE[lang] ?? MULTI_LANG_DATABASE.it;
  const baseCopy = langData[niche] ?? langData.generic;
  const copy = applyCopyVariation(baseCopy, lang, variationIndex);

  let heroTitle = copy.hero?.headline ?? "";
  let heroBody = copy.hero?.body ?? "";
  let proofTitle = copy.proof?.headline ?? "";
  let proofBody = copy.proof?.body ?? "";

  if (niche === "coloring" && copy.ageDynamic?.[age]) {
    const ageCopy = copy.ageDynamic[age]!;
    heroTitle = ageCopy.heroTitle;
    heroBody = ageCopy.heroBody;
    proofTitle = ageCopy.proofTitle;
    proofBody = ageCopy.proofBody;
  }

  return {
    hero: { title: `TARGET ETÀ SELEZIONATO: ${age.toUpperCase()}`, heading: heroTitle, body: heroBody, alt: copy.hero?.alt ?? "Product cover preview" },
    proof: { title: `TARGET ETÀ SELEZIONATO: ${age.toUpperCase()}`, heading: proofTitle, body: proofBody, alt: copy.proof?.alt ?? "Interior pages preview" },
    value: { title: copy.value.title, text1: copy.value.text1, text2: copy.value.text2, text3: copy.value.text3, alt: copy.value.alt },
    grid: { pages, items: copy.grid.slice(0, 3) },
    comp: { instructions: copy.comp, alt: "Header compare module." },
  };
}
