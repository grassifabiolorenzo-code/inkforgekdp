export type NicheId = "music" | "planner" | "coloring" | "generic";
export type LangId = "it" | "en" | "de" | "fr" | "es";
export type AgeId = "2-4" | "4-6" | "6-8" | "8-10" | "kids" | "adults";

export interface HeroProofCopy {
  headline: string;
  body: string;
  alt: string;
}

export interface ValueCopy {
  title: string;
  text1: string;
  text2: string;
  text3: string;
  alt: string;
}

export interface GridItemCopy {
  title: string;
  desc: string;
}

export interface AgeDynamicCopy {
  heroTitle: string;
  heroBody: string;
  proofTitle: string;
  proofBody: string;
}

export interface NicheCopy {
  hero?: HeroProofCopy;
  proof?: HeroProofCopy;
  value: ValueCopy;
  grid: GridItemCopy[];
  comp: string;
  ageDynamic?: Partial<Record<AgeId, AgeDynamicCopy>>;
}

export type LangDatabase = Record<NicheId, NicheCopy>;
export type MultiLangDatabase = Record<LangId, LangDatabase>;

export interface GeneratedModulesText {
  hero: { title: string; heading: string; body: string; alt: string };
  proof: { title: string; heading: string; body: string; alt: string };
  value: { title: string; text1: string; text2: string; text3: string; alt: string };
  grid: { pages: [number, number, number]; items: GridItemCopy[] };
  comp: { instructions: string; alt: string };
}
