import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  STORAGE_KEY_OUTPUT,
  STORAGE_KEY_UI,
  isLocale,
  type Locale,
} from "./config";
import { MESSAGES, type MessageKey } from "./messages";

export type { Locale };
export { LOCALES, LOCALE_META, DEFAULT_LOCALE } from "./config";

interface I18nValue {
  /** Lingua dell'interfaccia (sito + dashboard + tool). */
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Lingua dei contenuti generati dai tool (indipendente dall'interfaccia). */
  outputLocale: Locale;
  setOutputLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const interpolate = (template: string, vars?: Record<string, string | number>) =>
  vars
    ? template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
    : template;

function readStored(key: string): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(key);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // SSR-safe: si parte dal default e si allinea al valore salvato dopo l'hydration.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [outputLocale, setOutputLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const storedUi = readStored(STORAGE_KEY_UI);
    const storedOutput = readStored(STORAGE_KEY_OUTPUT);
    const browser = isLocale(navigator.language?.slice(0, 2)) ? (navigator.language.slice(0, 2) as Locale) : null;
    const next = storedUi ?? browser ?? DEFAULT_LOCALE;
    setLocaleState(next);
    setOutputLocaleState(storedOutput ?? next);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY_UI, next);
    } catch {
      /* storage non disponibile */
    }
    // Se l'utente non ha mai scelto una lingua di output, la allinea all'interfaccia.
    if (!readStored(STORAGE_KEY_OUTPUT)) setOutputLocaleState(next);
  }, []);

  const setOutputLocale = useCallback((next: Locale) => {
    setOutputLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY_OUTPUT, next);
    } catch {
      /* storage non disponibile */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      interpolate(MESSAGES[locale][key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key, vars),
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({ locale, setLocale, outputLocale, setOutputLocale, t }),
    [locale, setLocale, outputLocale, setOutputLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n deve essere usato dentro <I18nProvider>");
  return ctx;
}

/** Copy localizzata dei tool (nome, descrizione, beneficio, evento credito). */
export function useToolCopy() {
  const { t } = useI18n();
  return (toolId: string) => ({
    name: t(`tool.${toolId}.name` as MessageKey),
    description: t(`tool.${toolId}.desc` as MessageKey),
    benefit: t(`tool.${toolId}.benefit` as MessageKey),
    creditEvent: t(`tool.${toolId}.event` as MessageKey),
  });
}
