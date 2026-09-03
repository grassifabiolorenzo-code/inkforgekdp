/**
 * Punto di innesto per il provider email reale, con split per tipo di invio:
 * Resend gestisce transazionale/manuale (evento singolo, deliverability
 * pensata per basso/medio volume), Brevo gestisce le promozionali/campagne
 * (gestione liste e reputazione IP pensata per invii broadcast). Se il
 * provider indicato da `kind` non è configurato, nessun fallback automatico
 * sull'altro: transazionale e promozionale hanno regole di soppressione
 * diverse (vedi send.server.ts) — mescolarli silenziosamente sarebbe un
 * rischio di compliance, non solo tecnico. Se ENTRAMBI mancano, resta il
 * comportamento originale: "non configurato", nessuna chiamata di rete.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Instrada verso Brevo se "promotional", verso Resend altrimenti (default: transazionale). */
  kind?: "transactional" | "promotional" | "manual";
}

export interface SendEmailResult {
  ok: boolean;
  providerMessageId?: string | null;
  error?: string | null;
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  const from = process.env["RESEND_FROM_EMAIL"];
  if (!apiKey || !from) return { ok: false, error: "NO_PROVIDER_CONFIGURED" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
    });
    const body = (await response.json().catch(() => null)) as {
      id?: string;
      message?: string;
    } | null;
    if (!response.ok) {
      return { ok: false, error: body?.message ?? `Resend HTTP ${response.status}` };
    }
    return { ok: true, providerMessageId: body?.id ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function sendViaBrevo(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env["BREVO_API_KEY"];
  const fromEmail = process.env["BREVO_FROM_EMAIL"];
  const fromName = process.env["BREVO_FROM_NAME"] || "InkForgeKdp";
  if (!apiKey || !fromEmail) return { ok: false, error: "NO_PROVIDER_CONFIGURED" };

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
      }),
    });
    const body = (await response.json().catch(() => null)) as {
      messageId?: string;
      message?: string;
    } | null;
    if (!response.ok) {
      return { ok: false, error: body?.message ?? `Brevo HTTP ${response.status}` };
    }
    return { ok: true, providerMessageId: body?.messageId ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendViaProvider(input: SendEmailInput): Promise<SendEmailResult> {
  if (input.kind === "promotional") return sendViaBrevo(input);
  return sendViaResend(input);
}
