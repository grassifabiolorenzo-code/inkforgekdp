/**
 * Cattura errori lato browser che sfuggono al React error boundary (throw in
 * un event handler, una promise non gestita, uno script esterno). Prima di
 * questo, l'unico canale era `reportLovableError`, attivo solo dentro
 * l'anteprima dell'editor Lovable — mai per un utente reale in produzione.
 * No-op silenzioso se VITE_SENTRY_DSN non è configurato (vedi sentry.ts).
 */
import { captureError } from "./sentry";

let installed = false;

export function installClientErrorCapture(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    captureError(event.error ?? event.message, { source: "client", mechanism: "window.onerror" });
  });
  window.addEventListener("unhandledrejection", (event) => {
    captureError(event.reason, { source: "client", mechanism: "unhandledrejection" });
  });
}
