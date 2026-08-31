/**
 * Lingue supportate dalla piattaforma (UI e output dei tool).
 */
export const LOCALES = ["it", "en", "de", "fr", "es", "nl", "pt"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "it";

export const LOCALE_META: Record<Locale, { label: string; native: string; flag: string }> = {
  it: { label: "Italiano", native: "Italiano", flag: "🇮🇹" },
  en: { label: "English", native: "English", flag: "🇬🇧" },
  de: { label: "Deutsch", native: "Deutsch", flag: "🇩🇪" },
  fr: { label: "Français", native: "Français", flag: "🇫🇷" },
  es: { label: "Español", native: "Español", flag: "🇪🇸" },
  nl: { label: "Nederlands", native: "Nederlands", flag: "🇳🇱" },
  pt: { label: "Português", native: "Português", flag: "🇵🇹" },
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as readonly string[]).includes(value);

export const STORAGE_KEY_UI = "inkforgekdp.locale";
export const STORAGE_KEY_OUTPUT = "inkforgekdp.output-locale";
