import { logger } from "@/lib/logger.server";

/**
 * Architettura notifiche/email — predisposizione.
 * I singoli provider (Resend, SMTP, ecc.) potranno essere collegati qui
 * senza modificare la logica di business che emette gli eventi.
 */

export type NotificationEvent =
  | "welcome"
  | "subscription_confirmed"
  | "payment_success"
  | "payment_failed"
  | "payment_refunded"
  | "subscription_cancelled"
  | "limit_reached"
  | "renewal_upcoming";

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
};

/**
 * Punto di ingresso unico. Registra sempre l'evento nei log; per il sottoinsieme rilevante
 * all'admin, scrive anche una riga in admin_notifications (letta dal back office — vedi
 * lib/admin/notifications.functions.ts). L'invio email vero e proprio non è ancora collegato a
 * un provider: qui si registra solo l'evento, senza fingere che una mail sia stata spedita.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  logger.info("notification: dispatched", {
    event: payload.event,
    userId: payload.userId ?? null,
    email: payload.email ?? null,
  });

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
