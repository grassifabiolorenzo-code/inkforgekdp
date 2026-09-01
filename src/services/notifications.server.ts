import { logger } from "@/lib/logger.server";

/**
 * Punto di ingresso unico per gli eventi di ciclo vita: scrive sempre il log
 * e, per il sottoinsieme rilevante, il campanello admin; l'invio email vero e
 * proprio passa da src/lib/email/send.server.ts (sendTransactionalEmail), che
 * a sua volta resta "in coda/non inviato" finché non è collegato un provider
 * reale — vedi src/lib/email/provider.server.ts.
 */

export type NotificationEvent =
  | "welcome"
  | "subscription_confirmed"
  | "payment_success"
  | "payment_failed"
  | "payment_refunded"
  | "subscription_cancelled"
  | "limit_reached"
  | "renewal_upcoming"
  | "lead_captured";

export interface NotificationPayload {
  event: NotificationEvent;
  userId?: string | null;
  email?: string | null;
  data?: Record<string, unknown>;
}

/** Eventi rilevanti per l'admin (mostrati nel campanello del back office) e la loro severità. */
const ADMIN_RELEVANT_EVENTS: Partial<
  Record<NotificationEvent, { title: string; severity: "info" | "warning" | "critical" }>
> = {
  welcome: { title: "Nuovo utente registrato", severity: "info" },
  payment_failed: { title: "Pagamento fallito", severity: "critical" },
  payment_refunded: { title: "Pagamento rimborsato", severity: "warning" },
  subscription_cancelled: { title: "Abbonamento cancellato", severity: "warning" },
  renewal_upcoming: { title: "Rinnovo/trial in scadenza", severity: "info" },
  lead_captured: { title: "Nuovo contatto dalla landing", severity: "info" },
};

/** Eventi che generano una vera email transazionale (vedi email_templates.category='transactional'). */
const EMAIL_EVENTS = new Set<NotificationEvent>([
  "welcome",
  "subscription_confirmed",
  "payment_success",
  "payment_failed",
  "payment_refunded",
  "subscription_cancelled",
  "limit_reached",
  "renewal_upcoming",
]);

/**
 * Punto di ingresso unico. Registra sempre l'evento nei log; per il sottoinsieme rilevante
 * all'admin, scrive anche una riga in admin_notifications (letta dal back office — vedi
 * lib/admin/notifications.functions.ts); per gli eventi di ciclo vita, avvia anche l'invio
 * dell'email transazionale corrispondente (resta "in coda/non inviata" finché non è collegato
 * un provider — mai un errore che risalga al chiamante).
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  logger.info("notification: dispatched", {
    event: payload.event,
    userId: payload.userId ?? null,
    email: payload.email ?? null,
  });

  if (EMAIL_EVENTS.has(payload.event)) {
    const { sendTransactionalEmail } = await import("@/lib/email/send.server");
    await sendTransactionalEmail({
      event: payload.event,
      userId: payload.userId ?? null,
      email: payload.email ?? null,
      data: payload.data,
    });
  }

  const adminEvent = ADMIN_RELEVANT_EVENTS[payload.event];
  if (!adminEvent) return;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_notifications").insert({
      event: payload.event,
      title: adminEvent.title,
      body: payload.email ? `Utente: ${payload.email}` : null,
      severity: adminEvent.severity,
      metadata: { userId: payload.userId ?? null, ...payload.data },
    });
  } catch (error) {
    logger.error("notification: scrittura admin_notifications fallita", { error: String(error) });
  }
}
