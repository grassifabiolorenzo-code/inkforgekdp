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
    monthlyLimit: 300,
    unlimited: false,
    allowedTools: ["copertine", "pubblicazione", "aplus", "triage", "interni", "blurb", "bio", "promo"],
    firstMonthBonus: 0,
    recommended: true,
    badge: "PIÙ SCELTO",
    tagline: "Il piano ideale per chi pubblica ogni settimana.",
    features: [
      "Tutti i tool, incluso A+ KDPstudio e Interni",
      "300 utilizzi al mese",
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
    allowedTools: ["copertine", "pubblicazione", "aplus", "triage", "interni", "blurb", "bio", "promo"],
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
