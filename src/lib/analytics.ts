/**
 * Analytics lato client (PostHog + Google Analytics), entrambi sul piano
 * gratuito e caricati solo se le rispettive chiavi sono configurate — stesso
 * principio "niente SDK bundlato" già usato per Sentry (vedi sentry.ts): uno
 * script iniettato a runtime pesa meno di un SDK nel bundle, e qui tutto
 * resta lato browser (Cloudflare Workers non è coinvolto).
 *
 * ATTENZIONE PRIVACY: sia PostHog sia Google Analytics impostano
 * identificatori lato browser (cookie/localStorage) per riconoscere i
 * visitatori tra una sessione e l'altra. Per un pubblico UE questo richiede
 * tipicamente un consenso esplicito (GDPR/ePrivacy) PRIMA del caricamento —
 * questo modulo si limita a caricarli se configurati (con `respect_dnt` su
 * PostHog come minimo accorgimento), NON implementa alcun banner di
 * consenso: è una decisione di prodotto/legale da prendere a parte, non una
 * scelta tecnica di questo file.
 */

declare global {
  interface Window {
    posthog?: { init: (key: string, config: Record<string, unknown>) => void };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function installPostHog(): void {
  const key = import.meta.env["VITE_POSTHOG_KEY"] as string | undefined;
  if (!key) return;
  const host =
    (import.meta.env["VITE_POSTHOG_HOST"] as string | undefined) || "https://eu.i.posthog.com";

  const script = document.createElement("script");
  script.async = true;
  script.src = `${host}/static/array.js`;
  script.onload = () => {
    window.posthog?.init(key, { api_host: host, respect_dnt: true, capture_pageview: true });
  };
  document.head.appendChild(script);
}

function installGoogleAnalytics(): void {
  const measurementId = import.meta.env["VITE_GA_MEASUREMENT_ID"] as string | undefined;
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
}

let installed = false;

/** Idempotente: chiamabile più volte (es. React Strict Mode) senza duplicare gli script. */
export function installAnalytics(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  installPostHog();
  installGoogleAnalytics();
}
