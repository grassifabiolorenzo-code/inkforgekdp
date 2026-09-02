/**
 * Configurazione centralizzata dei piani.
 * Unica fonte di verità per prezzi, limiti e variant Lemon Squeezy lato client.
 * I limiti reali vengono comunque applicati server-side dal database.
 */

export type PlanSlug = "starter" | "pro" | "business";

export interface PlanConfig {
  slug: PlanSlug;
  name: string;
  price: number;
  currency: string;
  interval: "month";
  monthlyLimit: number | null;
  unlimited: boolean;
  /** Tool inclusi nel piano (deve rispecchiare plans.allowed_tools sul database). */
  allowedTools: string[];
  /** Bonus crediti concesso una sola volta, al primo abbonamento. */
  firstMonthBonus: number;
  recommended: boolean;
  badge?: string;
  tagline: string;
  features: string[];
  /** Funzionalità mostrate come escluse (X) nella card prezzi. */
  excludedFeatures?: string[];
  /** Placeholder configurabile: variant Lemon Squeezy (env pubblica). */
  variantEnvKey: string;
}

export const STARTER_BONUS_CREDITS = 50;

/** Tool disponibile solo nei piani superiori. */
export const PRO_ONLY_TOOLS = ["aplus"];

export const PLANS: PlanConfig[] = [
  {
    slug: "starter",
    name: "Starter",
    price: 15,
    currency: "EUR",
    interval: "month",
    monthlyLimit: 50,
    unlimited: false,
    allowedTools: ["copertine", "pubblicazione", "triage", "interni", "blurb", "bio", "promo"],
    firstMonthBonus: STARTER_BONUS_CREDITS,
    recommended: false,
    tagline: "Per iniziare a pubblicare con metodo.",
    features: [
      "Copertine, Pubblicazione, Triage, Interni, Blurb, Bio Autore e Promo Kit",
      "50 utilizzi al mese",
      "+50 utilizzi bonus il primo mese",
      "Storico utilizzi",
      "Supporto via email",
    ],
    excludedFeatures: ["A+ KDPstudio"],
    variantEnvKey: "VITE_LEMON_SQUEEZY_STARTER_VARIANT_ID",
  },
  {
    slug: "pro",
    name: "Pro",
    price: 35,
    currency: "EUR",
    interval: "month",
    // Alzato da un abbozzo iniziale di 300 (audit modernizzazione, 2026-09-02): con ogni
    // operazione a costo fisso di 1 credito indipendente da pagine/moduli (vedi consume_credit),
    // un publisher Pro a volume sostenuto (~12 libri/mese, moduli A+ inclusi) consuma in media
    // circa 65-70 crediti/mese. 120 lascia comunque un margine di quasi 2× sopra questa media,
    // lo stesso rapporto già presente nel piano Starter (50 crediti su una media stimata di
    // circa 28/mese) — non più il 4× di margine di prima, che regalava capacità mai usata dalla
    // maggioranza degli abbonati senza cambiare il prezzo.
    monthlyLimit: 120,
    unlimited: false,
    allowedTools: [
      "copertine",
      "pubblicazione",
      "aplus",
      "triage",
      "interni",
      "blurb",
      "bio",
      "promo",
    ],
    firstMonthBonus: 0,
    recommended: true,
    badge: "PIÙ SCELTO",
    tagline: "Il piano ideale per chi pubblica ogni settimana.",
    features: [
      "Tutti i tool, incluso A+ KDPstudio e Interni",
      "120 utilizzi al mese",
      "Storico utilizzi completo",
      "Priorità di elaborazione",
      "Supporto prioritario",
    ],
    variantEnvKey: "VITE_LEMON_SQUEEZY_PRO_VARIANT_ID",
  },
  {
    slug: "business",
    name: "Business",
    price: 99,
    currency: "EUR",
    interval: "month",
    monthlyLimit: null,
    unlimited: true,
    allowedTools: [
      "copertine",
      "pubblicazione",
      "aplus",
      "triage",
      "interni",
      "blurb",
      "bio",
      "promo",
    ],
    firstMonthBonus: 0,
    recommended: false,
    badge: "PREMIUM",
    tagline: "Nessun limite, per studi editoriali e team.",
    features: [
      "Tutti i tool, incluso A+ KDPstudio e Interni",
      "Utilizzo illimitato di tutti i tool",
      "Storico e analytics utilizzi",
      "Massima priorità di elaborazione",
      "Supporto dedicato",
    ],
    variantEnvKey: "VITE_LEMON_SQUEEZY_BUSINESS_VARIANT_ID",
  },
];

/** Il piano include il tool indicato? */
export const planAllowsTool = (slug: string | null | undefined, toolId: string) =>
  getPlan(slug)?.allowedTools.includes(toolId) ?? false;

/** Piani che includono il tool indicato. */
export const plansWithTool = (toolId: string) =>
  PLANS.filter((p) => p.allowedTools.includes(toolId));

export const getPlan = (slug: string | null | undefined): PlanConfig | undefined =>
  PLANS.find((p) => p.slug === slug);

export const formatPrice = (plan: PlanConfig) => `€${plan.price}/mese`;

/** Percorsi di upgrade consentiti a partire dal piano attivo. */
export const upgradePathFrom = (slug: string | null | undefined): PlanConfig[] => {
  if (slug === "starter") return PLANS.filter((p) => p.slug !== "starter");
  if (slug === "pro") return PLANS.filter((p) => p.slug === "business");
  if (slug === "business") return [];
  return PLANS;
};

export const planLimitLabel = (plan: PlanConfig) =>
  plan.unlimited ? "Illimitati" : `${plan.monthlyLimit}`;

/**
 * Pacchetto di crediti extra acquistabile una tantum (senza abbonamento), per chi esaurisce i
 * crediti del piano prima del rinnovo. Alzato da 10 a 15 crediti (audit modernizzazione,
 * 2026-09-02): con il limite Pro ridotto da 300 a 120, chi lavora a raffica sforerà il piano più
 * spesso di prima, e un pacchetto da 10 copriva a malapena 2 libri "medi" (~5,5 crediti/libro) —
 * 15 ne copre quasi 3, un salto più utile in pratica. Prezzo: €0,46/credito — resta più caro sia
 * di Starter (€0,30/credito) sia del nuovo Pro (€0,29/credito), per non rendere conveniente
 * comprare extra invece di fare upgrade, ma comunque un impulso a basso attrito per un bisogno
 * occasionale. Non scade e non si riporta al rinnovo: si somma semplicemente al monte crediti
 * disponibile.
 *
 * `id`/`variantEnvKey` restano "10" per compatibilità con l'env var e il prodotto Lemon Squeezy
 * già esistenti — sono etichette interne opache, non derivano dal valore di `credits`.
 */
export const CREDIT_PACK = {
  id: "credits10" as const,
  credits: 15,
  price: 6.9,
  currency: "EUR",
  variantEnvKey: "VITE_LEMON_SQUEEZY_CREDITPACK10_VARIANT_ID",
};
