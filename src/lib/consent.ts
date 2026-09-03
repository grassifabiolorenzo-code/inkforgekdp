/**
 * Stato del consenso per gli strumenti di analisi (PostHog, Google Analytics
 * — non Sentry, che riporta solo errori tecnici anonimi, non comportamento
 * dell'utente, e resta quindi fuori dallo scope di un consenso GDPR/ePrivacy
 * sui cookie di profilazione/analisi).
 *
 * Chiave versionata: se in futuro cambia cosa viene tracciato, basta alzare
 * la versione per far ripartire la richiesta di consenso a tutti, senza
 * dover distinguere "non ha mai scelto" da "aveva scelto sotto regole vecchie".
 */
const CONSENT_KEY = "inkforge.consent.analytics.v1";
const REOPEN_EVENT = "inkforge:consent-reopen";

export type ConsentChoice = "accepted" | "rejected";

export function getStoredConsent(): ConsentChoice | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function setStoredConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage non disponibile (es. modalità privata): il consenso non sopravvive al reload,
    // ma la scelta corrente resta comunque rispettata per la sessione in corso.
  }
}

/** Riapre il banner (es. da un link "Preferenze cookie" nel footer), senza ricaricare la pagina. */
export function reopenConsentBanner(): void {
  window.dispatchEvent(new Event(REOPEN_EVENT));
}

export function onConsentReopenRequested(handler: () => void): () => void {
  window.addEventListener(REOPEN_EVENT, handler);
  return () => window.removeEventListener(REOPEN_EVENT, handler);
}
