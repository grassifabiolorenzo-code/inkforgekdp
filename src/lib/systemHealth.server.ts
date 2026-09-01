/**
 * Controllo di salute del sistema, condiviso tra la vista admin completa
 * (/admin/system) e lo status pubblico (/status). Mai un secret/token/valore
 * di configurazione, solo stato/latenza — vedi le due funzioni server che lo
 * consumano per cosa viene effettivamente esposto a ciascun pubblico.
 */
export async function computeSystemHealth() {
  const { getBillingConfigStatus } = await import("@/lib/lemon-squeezy.server");

  // Un controllo che fallisce (es. servizio giù, credenziali non configurate) non deve mai far
  // fallire l'intera pagina di stato: è esattamente il caso che uno status/health check esiste
  // per segnalare, non per esserne vittima a sua volta.
  const dbStart = Date.now();
  let dbStatus: "operational" | "down" = "down";
  let dbErrorMessage: string | null = null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: dbError } = await supabaseAdmin.rpc("admin_db_ping");
    dbStatus = dbError ? "down" : "operational";
    dbErrorMessage = dbError?.message ?? null;
  } catch (err) {
    dbErrorMessage = err instanceof Error ? err.message : String(err);
  }
  const dbLatencyMs = Date.now() - dbStart;

  const billing = getBillingConfigStatus();

  return {
    checkedAt: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      error: dbErrorMessage,
    },
    authentication: { status: "operational" as const },
    paymentProvider: {
      status: billing.ready ? ("operational" as const) : ("not_configured" as const),
      provider: "Lemon Squeezy",
      configured: billing.ready,
    },
    emailProvider: {
      status: "not_configured" as const,
      note: "Nessun provider email transazionale collegato: le notifiche vengono solo registrate nei log del server.",
    },
    aiText: {
      status: process.env["GEMINI_API_KEY"]
        ? ("operational" as const)
        : ("not_configured" as const),
      provider: "Gemini",
    },
    environment: process.env["NODE_ENV"] ?? "production",
  };
}
