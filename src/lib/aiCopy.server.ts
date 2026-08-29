/**
 * Livello AI (Lovable AI Gateway) per la generazione dei testi dei tool
 * Pubblicazione e A+ KDPstudio a partire dai contenuti reali del libro
 * (copertina + pagine interne). Impronta obbligatoria: SEO long-tail, AIDA e PAS.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export const LOCALE_NAMES: Record<string, string> = {
  it: "italiano (Amazon.it)",
  en: "inglese (Amazon.com)",
  de: "tedesco (Amazon.de)",
  fr: "francese (Amazon.fr)",
  es: "spagnolo (Amazon.es)",
  nl: "olandese (Amazon.nl)",
  pt: "portoghese (Amazon.com.br)",
};

export interface SourceContent {
  interiorText?: string;
  interiorImages?: string[];
  coverImages?: string[];
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function buildBlocks(prompt: string, source: SourceContent): ContentBlock[] {
  const blocks: ContentBlock[] = [{ type: "text", text: prompt }];

  for (const url of (source.coverImages ?? []).slice(0, 2)) {
    blocks.push({ type: "text", text: "Immagine della COPERTINA del libro:" });
    blocks.push({ type: "image_url", image_url: { url } });
  }
  for (const url of (source.interiorImages ?? []).slice(0, 3)) {
    blocks.push({ type: "text", text: "Pagina INTERNA del libro:" });
    blocks.push({ type: "image_url", image_url: { url } });
  }
  const text = (source.interiorText ?? "").trim();
  if (text) {
    blocks.push({
      type: "text",
      text: `Testo estratto dalle pagine interne (potrebbe essere parziale):\n${text.slice(0, 6000)}`,
    });
  }
  return blocks;
}

async function callGateway(system: string, prompt: string, source: SourceContent): Promise<any> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI non configurata: LOVABLE_API_KEY mancante.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: buildBlocks(prompt, source) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 429) throw new Error("AI temporaneamente occupata: riprova tra qualche secondo.");
    if (response.status === 402) throw new Error("Crediti AI esauriti: aggiungi crediti al workspace.");
    if (response.status === 403) throw new Error("AI non disponibile per questo workspace.");
    throw new Error(`Errore AI (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Risposta AI non valida.");
  }
}

const COPY_SYSTEM = `Sei un copywriter senior specializzato in self-publishing su Amazon KDP.
Scrivi copy che rispetta contemporaneamente tre framework:
- SEO: keyword long-tail reali usate dagli acquirenti Amazon, inserite naturalmente;
- AIDA: attenzione, interesse, desiderio, azione;
- PAS: problema, agitazione, soluzione.
Analizzi copertina e pagine interne fornite e descrivi SOLO ciò che vedi realmente
(stile dei disegni, livello di dettaglio, tipo di esercizi, fascia d'età coerente).
Non inventare premi, dati di vendita, marchi, autori o personaggi protetti da copyright.
Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo.`;

export interface AiListingCopy {
  subject?: string;
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories?: string[];
  insight?: string;
}

export async function generateListingCopyAi(input: {
  locale: string;
  subject: string;
  bookType: string;
  audience: string;
  ageDetails: string;
  interiorPages: number;
  interiorText?: string;
  interiorImages?: string[];
  coverImages?: string[];
}): Promise<AiListingCopy> {
  const langName = LOCALE_NAMES[input.locale] ?? LOCALE_NAMES.en;
  const prompt = `Genera il listing Amazon KDP nella lingua: ${langName}.

Dati forniti dall'autore:
- soggetto dichiarato: ${input.subject || "(non specificato: dedurlo dai contenuti)"}
- tipo di libro: ${input.bookType}
- pubblico: ${input.audience} (${input.ageDetails})
- pagine interne rilevate: ${input.interiorPages || "n/d"}

Analizza copertina e pagine interne allegate, poi produci JSON con questa forma esatta:
{
  "subject": "soggetto reale dedotto dai contenuti (max 6 parole)",
  "title": "titolo max 60 caratteri, contiene la keyword principale",
  "subtitle": "sottotitolo SEO 100-180 caratteri con keyword secondarie",
  "description": "descrizione 5-6 paragrafi separati da \\n\\n: par.1-2 struttura PAS (problema + agitazione), par.3-4 soluzione e benefici concreti visti nelle pagine, par.5 desiderio, par.6 call to action. Nessun HTML.",
  "keywords": ["7 keyword long-tail diverse, 3-6 parole ciascuna, minuscole"],
  "categories": ["3 categorie BISAC Amazon in formato 'Ramo > Sotto > Sotto'"],
  "insight": "1-2 frasi su cosa mostrano realmente le pagine analizzate"
}`;

  const json = await callGateway(COPY_SYSTEM, prompt, {
    interiorText: input.interiorText,
    interiorImages: input.interiorImages,
    coverImages: input.coverImages,
  });

  const keywords = Array.isArray(json.keywords) ? json.keywords.map(String).filter(Boolean).slice(0, 7) : [];
  const categories = Array.isArray(json.categories)
    ? json.categories.map(String).filter(Boolean).slice(0, 3)
    : undefined;

  if (!json.title || !json.description) throw new Error("Risposta AI incompleta.");

  return {
    subject: json.subject ? String(json.subject) : undefined,
    title: String(json.title).slice(0, 200),
    subtitle: String(json.subtitle ?? ""),
    description: String(json.description),
    keywords,
    categories,
    insight: json.insight ? String(json.insight) : undefined,
  };
}

export interface AiAplusCopy {
  hero: { heading: string; body: string; alt: string };
  proof: { heading: string; body: string; alt: string };
  value: { title: string; text1: string; text2: string; text3: string; alt: string };
  grid: { title: string; desc: string }[];
  comp: string;
}

export async function generateAplusCopyAi(input: {
  lang: string;
  niche: string;
  age: string;
  title: string;
  interiorText?: string;
  interiorImages?: string[];
  coverImages?: string[];
}): Promise<AiAplusCopy> {
  const langName = LOCALE_NAMES[input.lang] ?? LOCALE_NAMES.en;
  const prompt = `Genera i testi dei moduli Contenuto A+ Amazon KDP nella lingua: ${langName}.

Contesto:
- titolo/nome progetto: ${input.title || "(non specificato)"}
- nicchia: ${input.niche}
- target d'età: ${input.age}

Analizza la copertina e le pagine interne allegate. I testi devono descrivere i contenuti
reali visti nelle immagini, con impronta SEO + AIDA + PAS e frasi brevi adatte ai banner A+.

Rispondi con JSON di questa forma esatta:
{
  "hero": { "heading": "titolo hero max 55 caratteri", "body": "2 frasi (problema + soluzione) max 260 caratteri", "alt": "alt SEO della copertina max 100 caratteri" },
  "proof": { "heading": "titolo max 55 caratteri sulle pagine interne", "body": "2 frasi con prove concrete viste nelle pagine, max 260 caratteri", "alt": "alt SEO delle pagine interne" },
  "value": { "title": "titolo del blocco vantaggi max 40 caratteri", "text1": "vantaggio 1 max 90 caratteri", "text2": "vantaggio 2 max 90 caratteri", "text3": "vantaggio 3 max 90 caratteri", "alt": "alt SEO del modulo vantaggi" },
  "grid": [ { "title": "max 28 caratteri", "desc": "max 110 caratteri" }, { "title": "...", "desc": "..." }, { "title": "...", "desc": "..." } ],
  "comp": "istruzioni d'uso / invito all'azione max 200 caratteri"
}`;

  const json = await callGateway(COPY_SYSTEM, prompt, {
    interiorText: input.interiorText,
    interiorImages: input.interiorImages,
    coverImages: input.coverImages,
  });

  const str = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  const grid = Array.isArray(json.grid) ? json.grid.slice(0, 3) : [];
  if (!json.hero || !json.value) throw new Error("Risposta AI incompleta.");

  return {
    hero: {
      heading: str(json.hero.heading),
      body: str(json.hero.body),
      alt: str(json.hero.alt, "Product cover preview"),
    },
    proof: {
      heading: str(json.proof?.heading),
      body: str(json.proof?.body),
      alt: str(json.proof?.alt, "Interior pages preview"),
    },
    value: {
      title: str(json.value.title),
      text1: str(json.value.text1),
      text2: str(json.value.text2),
      text3: str(json.value.text3),
      alt: str(json.value.alt, "Value highlights"),
    },
    grid: grid.map((item: any, i: number) => ({
      title: str(item?.title, `Highlight ${i + 1}`),
      desc: str(item?.desc),
    })),
    comp: str(json.comp),
  };
}
