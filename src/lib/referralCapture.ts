/**
 * Cattura lato client del codice referral prima della registrazione. Il
 * codice viaggia in localStorage (non un cookie: nessuna gestione server-side
 * necessaria per un valore non sensibile) tra la visita a /r/:code e il primo
 * accesso autenticato, dove getAccountState lo consuma UNA SOLA VOLTA al
 * momento della creazione del profilo (vedi credits.functions.ts).
 */
const STORAGE_KEY = "inkforgekdp_referral_code";

export function storeReferralCode(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code.trim().toUpperCase());
  } catch {
    // Storage non disponibile (privacy mode, ecc.): il referral semplicemente non viene catturato.
  }
}

/** Legge il codice senza consumarlo (usato per non perderlo se la prima chiamata fallisce). */
export function peekReferralCode(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearReferralCode(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
