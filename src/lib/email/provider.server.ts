/**
 * Punto di innesto unico per il provider email reale (Resend, SendGrid,
 * Postmark, SES, ecc.). Nessun provider è ancora stato scelto: questa è
 * l'unica implementazione, e non fa alcuna chiamata di rete — ritorna sempre
 * "non configurato", esattamente come readLemonConfig() prima della
 * registrazione a Lemon Squeezy. Il resto del sistema (template, campagne,
 * log di ogni invio) è già completo e funzionante: il giorno in cui verrà
 * scelto un provider, basterà sostituire il corpo di sendViaProvider() con la
 * chiamata HTTP reale, senza toccare nessun altro file.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  ok: boolean;
  providerMessageId?: string | null;
  error?: string | null;
}

export async function sendViaProvider(_input: SendEmailInput): Promise<SendEmailResult> {
  return { ok: false, error: "NO_PROVIDER_CONFIGURED" };
}
