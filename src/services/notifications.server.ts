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
  | "subscription_cancelled"
  | "limit_reached"
  | "renewal_upcoming";

export interface NotificationPayload {
  event: NotificationEvent;
  userId?: string | null;
  email?: string | null;
  data?: Record<string, unknown>;
}

/**
 * Punto di ingresso unico. Attualmente registra l'evento nei log:
 * sostituire il corpo con la chiamata al provider email scelto.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<void> {
  console.info("[notification]", payload.event, {
    userId: payload.userId ?? null,
    email: payload.email ?? null,
  });
}
