/**
 * Livello AI (Gemini API diretta, Google) per la generazione dei testi dei tool
 * Pubblicazione, A+ KDPstudio, Blurb, Bio e Promo a partire dai contenuti reali del libro
 * (copertina + pagine interne). Impronta obbligatoria: SEO long-tail, AIDA e PAS.
 *
 * Modello: Flash-Lite, il livello più economico della famiglia Gemini 3 non in dismissione
 * al momento della scrittura (2026-08). Verificare l'ID esatto in Google AI Studio prima
 * del primo uso reale: i nomi/prezzi dei modelli Gemini cambiano spesso.
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_TEXT_MODEL = "gemini-3.1-flash-lite";

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
  interiorText?: string | undefined;
  interiorImages?: string[] | undefined;
  coverImages?: string[] | undefined;
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

/** Traduce tono + livello di creatività in istruzioni di stile per il modello. */
export function buildStyleDirective(tone?: string, creativity?: number): string {
  const level = Math.min(10, Math.max(1, Math.round(creativity ?? 5)));
  const tones: Record<string, string> = {
    professionale: "professionale e misurato, chiaro e credibile, senza enfasi eccessiva",
    amichevole: "amichevole e conversazionale, come un consiglio dato a un amico",
    energico: "energico e dinamico, con frasi brevi e ritmo incalzante ma non urlato",
    caloroso: "caloroso e familiare, empatico verso genitori ed educatori",
    autorevole: "autorevole ed esperto, con precisione didattica e riferimenti concreti",
    giocoso: "giocoso e leggero, con immagini semplici e un sorriso, mai infantile",
  };
  const toneText = tones[tone ?? ""] ?? tones["amichevole"]!;
  const creativityText =
    level <= 3
      ? "Resta molto aderente a ciò che si vede nelle pagine: descrizioni fattuali, poche metafore."
      : level <= 7
        ? "Bilancia fedeltà ai contenuti e scrittura vivace: qualche immagine concreta, nessuna invenzione."
        : "Usa una scrittura più libera e immaginifica (scene quotidiane, dettagli sensoriali), restando comunque coerente con ciò che le pagine mostrano davvero.";
  return `TONO DI VOCE richiesto: ${toneText}.
LIVELLO DI CREATIVITÀ: ${level}/10. ${creativityText}
Mantieni il tono coerente in tutti i testi generati.`;
}

function temperatureFor(creativity?: number): number {
  const level = Math.min(10, Math.max(1, Math.round(creativity ?? 5)));
  return Math.round((0.3 + (level - 1) * 0.075) * 100) / 100;
}

/** Converte i blocchi (testo/immagine) nel formato "parts" richiesto da Gemini. */
function partsFromBlocks(blocks: ContentBlock[]): Record<string, unknown>[] {
  return blocks.map((block) => {
    if (block.type === "text") return { text: block.text };
    const match = /^data:([^;]+);base64,(.+)$/.exec(block.image_url.url);
    if (!match) throw new Error("Formato immagine non valido: attesa data URL base64.");
    return { inlineData: { mimeType: match[1], data: match[2] } };
  });
}

async function callGateway(
  system: string,
  prompt: string,
  source: SourceContent,
  creativity?: number,
): Promise<any> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) throw new Error("AI non configurata: GEMINI_API_KEY mancante.");

  const response = await fetch(`${GEMINI_API_BASE}/${GEMINI_TEXT_MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: partsFromBlocks(buildBlocks(prompt, source)) }],
      generationConfig: {
        temperature: temperatureFor(creativity),
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 429) throw new Error("AI temporaneamente occupata: riprova tra qualche secondo.");
    if (response.status === 402 || response.status === 403)
      throw new Error("AI non disponibile: verifica fatturazione/quota del progetto Gemini.");
    throw new Error(`Errore AI (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const parts: Array<{ text?: string }> = data?.candidates?.[0]?.content?.parts ?? [];
  const content = parts.map((p) => p.text ?? "").join("");
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Risposta AI non valida.");
  }
}

const COPY_SYSTEM = `Sei un copywriter senior umano, specializzato in self-publishing su Amazon KDP.
Scrivi come una persona reale che parla a un genitore, a un insegnante o a un adulto appassionato:
tono caldo, concreto, conversazionale, con ritmo variabile (frasi brevi alternate a frasi più ampie),
domande dirette al lettore, immagini quotidiane e piccoli dettagli sensoriali.
Evita assolutamente il linguaggio robotico o pubblicitario da elenco: niente superlativi vuoti
("il migliore in assoluto", "rivoluzionario"), niente frasi fatte da AI ("nel mondo di oggi",
"immergiti in un viaggio"), niente ripetizioni meccaniche della keyword, niente emoji.
Rispetta contemporaneamente tre framework, ma in modo naturale e invisibile:
- SEO: keyword long-tail reali usate dagli acquirenti Amazon, inserite dentro frasi che suonano umane;
- AIDA: attenzione, interesse, desiderio, azione;
- PAS: problema, agitazione, soluzione.
Analizzi copertina e pagine interne fornite e descrivi SOLO ciò che vedi realmente
(soggetti dei disegni, stile del tratto, livello di dettaglio, tipo di esercizi, spessore delle linee,
spazi bianchi, coerenza con la fascia d'età). Cita dettagli specifici e verificabili delle pagine
analizzate: sono la prova che il testo parla di QUESTO libro e non di un libro generico.
Non inventare premi, dati di vendita, marchi, autori o personaggi protetti da copyright.
Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo.`;


export interface AiListingCopy {
  subject?: string | undefined;
  title: string;
  subtitle: string;
  description: string;
  keywords: string[];
  categories?: string[] | undefined;
  insight?: string | undefined;
}

export async function generateListingCopyAi(input: {
  locale: string;
  subject: string;
  bookType: string;
  audience: string;
  ageDetails: string;
  interiorPages: number;
  tone?: string | undefined;
  creativity?: number | undefined;
  interiorText?: string | undefined;
  interiorImages?: string[] | undefined;
  coverImages?: string[] | undefined;
}): Promise<AiListingCopy> {
  const langName = LOCALE_NAMES[input.locale] ?? LOCALE_NAMES['en']!;
  const prompt = `Genera il listing Amazon KDP nella lingua: ${langName}.

${buildStyleDirective(input.tone, input.creativity)}

Dati forniti dall'autore:
- soggetto dichiarato: ${input.subject || "(non specificato: dedurlo dai contenuti)"}
- tipo di libro: ${input.bookType}
- pubblico: ${input.audience} (${input.ageDetails})
- pagine interne rilevate: ${input.interiorPages || "n/d"}

Analizza copertina e pagine interne allegate. La descrizione deve essere LUNGA e ARTICOLATA
(1600-2400 caratteri complessivi), scritta con voce umana e riferimenti espliciti a ciò che si vede
davvero nelle pagine analizzate. Produci JSON con questa forma esatta:
{
  "subject": "soggetto reale dedotto dai contenuti (max 6 parole)",
  "title": "titolo max 60 caratteri, contiene la keyword principale",
  "subtitle": "sottotitolo SEO 100-180 caratteri con keyword secondarie",
  "description": "descrizione lunga di 8-9 paragrafi separati da \\n\\n, 1600-2400 caratteri totali. Struttura: par.1 gancio umano che descrive una scena quotidiana del lettore; par.2 il problema reale; par.3 agitazione (cosa succede se non si risolve, delusioni con libri simili); par.4 presentazione del libro con i dettagli concreti visti nelle pagine; par.5 elenco discorsivo di 3-4 benefici legati a quei contenuti reali; par.6 dettagli tecnici utili (numero di pagine, stampa su un solo lato se visibile, spessore dei tratti, spazi per colorare); par.7 desiderio e piccola proiezione emotiva; par.8 rassicurazione (per chi è adatto, come usarlo); par.9 call to action calda e diretta. Nessun HTML, nessun elenco puntato, nessuna emoji, nessuna ripetizione meccanica della keyword.",
  "keywords": ["7 keyword long-tail diverse, 3-6 parole ciascuna, minuscole"],
  "categories": ["3 categorie BISAC Amazon in formato 'Ramo > Sotto > Sotto'"],
  "insight": "2-3 frasi che riassumono cosa mostrano realmente le pagine analizzate"
}`;


  const json = await callGateway(COPY_SYSTEM, prompt, {
    interiorText: input.interiorText,
    interiorImages: input.interiorImages,
    coverImages: input.coverImages,
  }, input.creativity);

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
  tone?: string | undefined;
  creativity?: number | undefined;
  interiorText?: string | undefined;
  interiorImages?: string[] | undefined;
  coverImages?: string[] | undefined;
}): Promise<AiAplusCopy> {
  const langName = LOCALE_NAMES[input.lang] ?? LOCALE_NAMES['en']!;
  const prompt = `Genera i testi dei moduli Contenuto A+ Amazon KDP nella lingua: ${langName}.

${buildStyleDirective(input.tone, input.creativity)}

Contesto:
- titolo/nome progetto: ${input.title || "(non specificato)"}
- nicchia: ${input.niche}
- target d'età: ${input.age}

Analizza la copertina e le pagine interne allegate. I testi devono descrivere i contenuti
reali visti nelle immagini (soggetti, tratto, esercizi, spazi bianchi), con voce umana e naturale,
impronta SEO + AIDA + PAS e frasi brevi adatte ai banner A+. Ogni modulo deve dire qualcosa di
diverso e specifico di QUESTO libro: nessuna frase generica riutilizzabile per un altro titolo,
nessun superlativo vuoto, nessuna emoji.

I 3 elementi di "grid" devono essere OBBLIGATORIAMENTE distinti tra loro: ciascuno copre un
aspetto concreto diverso del prodotto (es. uno la qualità del tratto/stampa, uno l'organizzazione
delle pagine o degli spazi, uno il formato/materiali/praticità d'uso) — mai due elementi che
ripetono lo stesso concetto con parole diverse, e mai la stessa frase o chiusura ripetuta in
più di un elemento.


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
  }, input.creativity);

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

/* ------------------------------------------------------------------------ */
/* Tool 6 — Blurb & Sinossi (narrativa/saggistica)                          */
/* ------------------------------------------------------------------------ */

const BLURB_SYSTEM = `Sei un copywriter editoriale senior, specializzato in quarte di copertina,
sinossi ed editorial blurb per narrativa e saggistica (qualsiasi genere: thriller, fantasy,
romance, memoir, business/self-help, ecc.). Scrivi come un umano esperto del settore editoriale:
tono variabile in base al genere e al tono richiesto, ritmo curato, mai robotico o da elenco AI
(evita "nel mondo di oggi", "immergiti in un viaggio", superlativi vuoti, emoji).
Non inventare mai premi, citazioni di terzi, marchi o riferimenti a persone reali.
Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo.`;

export interface AiBlurbCopy {
  hook: string;
  synopsis: string;
  editorialBlurb: string;
}

export async function generateBlurbCopyAi(input: {
  locale: string;
  title: string;
  genre: string;
  protagonist: string;
  setting?: string | undefined;
  conflict: string;
  stakes?: string | undefined;
  tone?: string | undefined;
  creativity?: number | undefined;
}): Promise<AiBlurbCopy> {
  const langName = LOCALE_NAMES[input.locale] ?? LOCALE_NAMES["en"]!;
  const prompt = `Genera il testo di vendita per un libro nella lingua: ${langName}.

${buildStyleDirective(input.tone, input.creativity)}

Dati forniti dall'autore:
- titolo: ${input.title}
- genere: ${input.genre}
- protagonista / argomento principale: ${input.protagonist}
- ambientazione / contesto: ${input.setting || "(non specificata)"}
- conflitto centrale / tema chiave: ${input.conflict}
- posta in gioco: ${input.stakes || "(non specificata, deducila dal conflitto)"}

Produci JSON con questa forma esatta:
{
  "hook": "una riga d'apertura ad effetto, max 160 caratteri",
  "synopsis": "quarta di copertina / sinossi completa, 3-5 frasi ben costruite, 400-800 caratteri, aderente al genere indicato",
  "editorialBlurb": "una citazione editoriale in stile recensione professionale, tra virgolette, max 140 caratteri"
}`;

  const json = await callGateway(BLURB_SYSTEM, prompt, {}, input.creativity);

  const str = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  if (!json.hook || !json.synopsis) throw new Error("Risposta AI incompleta.");

  return {
    hook: str(json.hook),
    synopsis: str(json.synopsis),
    editorialBlurb: str(json.editorialBlurb),
  };
}

/* ------------------------------------------------------------------------ */
/* Tool 7 — Bio Autore & Kit Stampa                                         */
/* ------------------------------------------------------------------------ */

const BIO_SYSTEM = `Sei un ghostwriter specializzato in bio autore e comunicati stampa per il mondo
editoriale self-publishing. Scrivi in modo umano, credibile e mai gonfio di superlativi vuoti o
frasi fatte da AI. Non inventare mai premi, numeri di vendita, testate giornalistiche o
collaborazioni che l'autore non ha dichiarato esplicitamente.
Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo.`;

export interface AiBioCopy {
  shortBio: string;
  mediumBio: string;
  longBio: string;
  pressRelease: string;
}

export async function generateBioCopyAi(input: {
  locale: string;
  authorName: string;
  niche: string;
  achievements?: string | undefined;
  personalTouch?: string | undefined;
  tone?: string | undefined;
  creativity?: number | undefined;
  bookTitle?: string | undefined;
  releaseInfo?: string | undefined;
  links?: string | undefined;
}): Promise<AiBioCopy> {
  const langName = LOCALE_NAMES[input.locale] ?? LOCALE_NAMES["en"]!;
  const prompt = `Genera bio autore e comunicato stampa nella lingua: ${langName}.

${buildStyleDirective(input.tone, input.creativity)}

Dati forniti dall'autore:
- nome autore: ${input.authorName}
- nicchia / genere di scrittura: ${input.niche}
- traguardi/credenziali dichiarati: ${input.achievements || "(nessuno dichiarato: resta generico ma credibile)"}
- elementi personali da includere: ${input.personalTouch || "(nessuno)"}
- libro da lanciare: ${input.bookTitle || "(non specificato)"}
- data/info uscita: ${input.releaseInfo || "(non specificata)"}
- link/social da citare: ${input.links || "(nessuno)"}

Produci JSON con questa forma esatta:
{
  "shortBio": "bio brevissima per social/Twitter-X, max 160 caratteri",
  "mediumBio": "bio media per Amazon Author Central, 300-500 caratteri",
  "longBio": "bio lunga per sito/retro copertina, 600-1200 caratteri, include gli elementi personali se forniti",
  "pressRelease": "comunicato stampa di lancio libro completo, con oggetto, corpo e chiusura, 800-1400 caratteri, include il titolo del libro e le info di uscita se fornite"
}`;

  const json = await callGateway(BIO_SYSTEM, prompt, {}, input.creativity);

  const str = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  if (!json.shortBio || !json.mediumBio) throw new Error("Risposta AI incompleta.");

  return {
    shortBio: str(json.shortBio),
    mediumBio: str(json.mediumBio),
    longBio: str(json.longBio),
    pressRelease: str(json.pressRelease),
  };
}

/* ------------------------------------------------------------------------ */
/* Tool 8 — Social & Ads Promo Kit                                          */
/* ------------------------------------------------------------------------ */

const PROMO_SYSTEM = `Sei un social media manager e ads copywriter specializzato nel lancio di libri
su Amazon. Scrivi post nativi per ogni piattaforma indicata (linguaggio e ritmo adatti a ciascuna),
headline e bullet efficaci per Amazon Sponsored Products, ed email di lancio dirette e persuasive.
Mai superlativi vuoti, mai frasi fatte da AI, mai emoji eccessive (massimo 1-2 per post, solo se
la piattaforma lo giustifica). Non inventare premi, dati di vendita o recensioni.
Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo.`;

export interface AiPromoCopy {
  posts: { platform: string; caption: string }[];
  adsHeadlines: string[];
  adsBullets: string[];
  launchEmail: string;
}

export async function generatePromoCopyAi(input: {
  locale: string;
  bookTitle: string;
  genre?: string | undefined;
  usp: string;
  audience: string;
  cta?: string | undefined;
  platforms: string[];
  tone?: string | undefined;
  creativity?: number | undefined;
}): Promise<AiPromoCopy> {
  const langName = LOCALE_NAMES[input.locale] ?? LOCALE_NAMES["en"]!;
  const platformList = input.platforms.length > 0 ? input.platforms.join(", ") : "instagram, facebook";
  const prompt = `Genera materiale promozionale di lancio libro nella lingua: ${langName}.

${buildStyleDirective(input.tone, input.creativity)}

Dati forniti dall'autore:
- titolo libro: ${input.bookTitle}
- genere: ${input.genre || "(non specificato)"}
- punto di forza principale (USP): ${input.usp}
- target/pubblico ideale: ${input.audience}
- call to action: ${input.cta || "(usa una CTA generica di acquisto su Amazon)"}
- piattaforme richieste: ${platformList}

Produci JSON con questa forma esatta:
{
  "posts": [ { "platform": "uno tra: ${platformList}", "caption": "caption nativa per quella piattaforma, con eventuali hashtag pertinenti, 100-400 caratteri" } — un oggetto per ciascuna piattaforma richiesta ],
  "adsHeadlines": ["3 headline per Amazon Sponsored Products, max 80 caratteri ciascuna"],
  "adsBullets": ["3 bullet per Amazon Sponsored Products, max 90 caratteri ciascuno"],
  "launchEmail": "email di annuncio lancio completa con oggetto e corpo, 500-900 caratteri"
}`;

  const json = await callGateway(PROMO_SYSTEM, prompt, {}, input.creativity);

  const str = (v: unknown, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  const posts = Array.isArray(json.posts)
    ? json.posts
        .map((p: any) => ({ platform: str(p?.platform), caption: str(p?.caption) }))
        .filter((p: { platform: string; caption: string }) => p.platform && p.caption)
    : [];
  const adsHeadlines = Array.isArray(json.adsHeadlines) ? json.adsHeadlines.map(String).filter(Boolean).slice(0, 3) : [];
  const adsBullets = Array.isArray(json.adsBullets) ? json.adsBullets.map(String).filter(Boolean).slice(0, 3) : [];

  if (posts.length === 0 || !json.launchEmail) throw new Error("Risposta AI incompleta.");

  return { posts, adsHeadlines, adsBullets, launchEmail: str(json.launchEmail) };
}

/* ------------------------------------------------------------------------ */
/* Tool 4 — Triage: suggerimento AI di categoria (revisione resta manuale)  */
/* ------------------------------------------------------------------------ */

const TRIAGE_SYSTEM = `Sei un supervisore di controllo qualità per immagini destinate alla stampa KDP
(coloring book, activity book, quaderni). Osservi UNA immagine alla volta e dai un parere tecnico e
onesto: la decisione finale resta SEMPRE dell'operatore umano, tu dai solo un suggerimento.
Valuta: nitidezza/messa a fuoco, contrasto e leggibilità dei tratti, artefatti di compressione,
inquadratura (tagli, bordi indesiderati, rotazione evidente), watermark/loghi non voluti, pagina
vuota o corrotta. Non conosci il contesto del libro: basa il giudizio solo su ciò che vedi.
Rispondi SEMPRE ed ESCLUSIVAMENTE con un oggetto JSON valido, senza testo aggiuntivo.`;

export interface AiTriageSuggestion {
  category: "promossa" | "rimandata" | "bocciata";
  reason: string;
}

export async function analyzeTriageImageAi(input: {
  locale: string;
  imageDataUrl: string;
}): Promise<AiTriageSuggestion> {
  const langName = LOCALE_NAMES[input.locale] ?? LOCALE_NAMES["en"]!;
  const prompt = `Analizza l'immagine allegata e suggerisci una categoria di triage, con una motivazione
breve nella lingua: ${langName}.

Linee guida:
- "promossa": qualità tecnica buona, nessun problema evidente.
- "rimandata": qualità dubbia o problema minore da valutare con più attenzione (leggero sfocato,
  contrasto basso, inquadratura imperfetta).
- "bocciata": problema grave ed evidente (fuori fuoco marcato, pagina vuota/corrotta, watermark
  invadente, taglio che compromette il contenuto).

Produci JSON con questa forma esatta:
{
  "category": "promossa" | "rimandata" | "bocciata",
  "reason": "una frase breve (max 140 caratteri) che spiega il motivo del suggerimento"
}`;

  const json = await callGateway(TRIAGE_SYSTEM, prompt, { interiorImages: [input.imageDataUrl] }, 2);

  const category = json.category;
  if (category !== "promossa" && category !== "rimandata" && category !== "bocciata") {
    throw new Error("Risposta AI incompleta.");
  }
  return {
    category,
    reason: typeof json.reason === "string" ? json.reason.trim().slice(0, 200) : "",
  };
}
