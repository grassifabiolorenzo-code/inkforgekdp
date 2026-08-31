import { createFileRoute } from "@tanstack/react-router";

import { STARTER_BONUS_CREDITS } from "@/config/plans";
import { logger } from "@/lib/logger.server";

/**
 * Webhook Lemon Squeezy — unica fonte di verità per lo stato dell'abbonamento.
 * La firma viene verificata prima di qualsiasi scrittura.
 */

interface LemonWebhook {
  meta?: {
    event_name?: string;
    custom_data?: {
      user_id?: string;
      plan_slug?: string;
      purchase_type?: string;
      credits?: string;
    };
  };
  data?: {
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

const ACTIVE_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_resumed",
  "subscription_cancelled",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
]);

function statusFromEvent(event: string, attrStatus: string | undefined): string {
  switch (event) {
    case "subscription_cancelled":
      return "cancelled";
    case "subscription_expired":
      return "expired";
    case "subscription_paused":
      return "paused";
    case "subscription_payment_failed":
      return "past_due";
    case "subscription_resumed":
    case "subscription_unpaused":
      return "active";
    default:
      return attrStatus ?? "active";
  }
}

export const Route = createFileRoute("/api/public/lemon-squeezy/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-signature");

        const { verifyWebhookSignature, planSlugForVariant } =
          await import("@/lib/lemon-squeezy.server");

        let valid = false;
        try {
          valid = await verifyWebhookSignature(raw, signature);
        } catch (error) {
          logger.error("lemon-webhook: config error", { error: String(error) });
          return new Response("Webhook non configurato", { status: 500 });
        }
        if (!valid) return new Response("Invalid signature", { status: 401 });

        let payload: LemonWebhook;
        try {
          payload = JSON.parse(raw) as LemonWebhook;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = payload.meta?.event_name ?? "";

        // Acquisto one-time del pacchetto crediti extra (non un abbonamento).
        if (event === "order_created") {
          const customData = payload.meta?.custom_data;
          const orderAttrs = payload.data?.attributes ?? {};
          const orderId = payload.data?.id;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          if (customData?.purchase_type === "credit_pack" && customData.user_id) {
            const amount = Number(customData.credits ?? "0");
            if (amount > 0 && orderId) {
              const { error } = await supabaseAdmin.rpc("add_purchased_credits", {
                _user_id: customData.user_id,
                _amount: amount,
                _operation_id: `ls-order-${orderId}`,
                _description: `Acquisto pacchetto ${amount} crediti`,
              });
              if (error)
                logger.error("lemon-webhook: add_purchased_credits failed", {
                  error: error.message,
                  orderId,
                  userId: customData.user_id,
                });
            }
          }

          // Ledger pagamenti: registrato per qualunque ordine one-time (non solo i pacchetti crediti),
          // così /admin/payments mostra la cronologia reale invece di restare vuoto.
          if (orderId) {
            const totalCents = orderAttrs["total"];
            const { error: payError } = await supabaseAdmin.from("payments").upsert(
              {
                user_id: customData?.user_id ?? null,
                provider: "lemon_squeezy",
                provider_payment_id: String(orderId),
                provider_order_id: String(orderId),
                plan_slug:
                  customData?.plan_slug ??
                  (customData?.purchase_type === "credit_pack" ? "credits10" : null),
                amount: typeof totalCents === "number" ? totalCents / 100 : null,
                currency:
                  typeof orderAttrs["currency"] === "string"
                    ? (orderAttrs["currency"] as string)
                    : "EUR",
                status: "succeeded",
                description:
                  customData?.purchase_type === "credit_pack"
                    ? "Pacchetto crediti extra"
                    : "Ordine one-time",
              },
              { onConflict: "provider,provider_payment_id", ignoreDuplicates: true },
            );
            if (payError)
              logger.error("lemon-webhook: payments upsert (order_created) failed", {
                error: payError.message,
                orderId,
              });
          }
          return new Response("ok", { status: 200 });
        }

        // Rimborso di un ordine one-time (es. pacchetto crediti). Non tocca i crediti già erogati:
        // un eventuale storno manuale dei crediti resta una decisione dell'admin, non automatica.
        if (event === "order_refunded") {
          const orderId = payload.data?.id;
          if (orderId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { error } = await supabaseAdmin
              .from("payments")
              .update({ status: "refunded" })
              .eq("provider", "lemon_squeezy")
              .eq("provider_payment_id", String(orderId));
            if (error)
              logger.error("lemon-webhook: refund update failed", {
                error: error.message,
                orderId,
              });

            const { data: payRow } = await supabaseAdmin
              .from("payments")
              .select("user_id")
              .eq("provider_payment_id", String(orderId))
              .maybeSingle();
            if (payRow?.user_id) {
              const { dispatchNotification } = await import("@/services/notifications.server");
              await dispatchNotification({ event: "payment_refunded", userId: payRow.user_id });
            }
          }
          return new Response("ok", { status: 200 });
        }

        if (!ACTIVE_EVENTS.has(event)) return new Response("ignored", { status: 200 });

        const attrs = payload.data?.attributes ?? {};
        const userId = payload.meta?.custom_data?.user_id ?? null;
        const lsSubscriptionId = String(
          (event.startsWith("subscription_payment")
            ? attrs["subscription_id"]
            : payload.data?.id) ?? "",
        );
        if (!lsSubscriptionId) return new Response("missing subscription id", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { dispatchNotification } = await import("@/services/notifications.server");

        // Riga esistente (se l'abbonamento è già noto).
        const { data: existing } = await supabaseAdmin
          .from("subscriptions")
          .select("id, user_id, plan_id, credits_used")
          .eq("lemon_squeezy_subscription_id", lsSubscriptionId)
          .maybeSingle();

        const resolvedUserId = userId ?? existing?.user_id ?? null;
        if (!resolvedUserId) {
          logger.error("lemon-webhook: utente non identificato", { event, lsSubscriptionId });
          return new Response("user not identified", { status: 202 });
        }

        // Risoluzione del piano: variant id o custom data.
        const variantSlug =
          planSlugForVariant(attrs["variant_id"] as string | number | undefined) ??
          payload.meta?.custom_data?.plan_slug ??
          null;

        let planId = existing?.plan_id ?? null;
        let planSlug = variantSlug;
        if (variantSlug) {
          const { data: plan } = await supabaseAdmin
            .from("plans")
            .select("id, slug")
            .eq("slug", variantSlug)
            .maybeSingle();
          if (plan) {
            planId = plan.id;
            planSlug = plan.slug;
          }
        }

        const status = statusFromEvent(event, attrs["status"] as string | undefined);
        const renewsAt = (attrs["renews_at"] as string | null) ?? null;
        const endsAt = (attrs["ends_at"] as string | null) ?? null;
        const createdAt = (attrs["created_at"] as string | null) ?? null;

        const isRenewalPayment =
          event === "subscription_payment_success" &&
          (attrs["billing_reason"] as string | undefined) !== "initial";

        const patch: Record<string, unknown> = {
          user_id: resolvedUserId,
          lemon_squeezy_subscription_id: lsSubscriptionId,
          lemon_squeezy_customer_id: attrs["customer_id"] ? String(attrs["customer_id"]) : null,
          status,
          updated_at: new Date().toISOString(),
        };
        if (planId) patch["plan_id"] = planId;
        if (renewsAt || endsAt) patch["current_period_end"] = renewsAt ?? endsAt;
        if (!existing && createdAt) patch["current_period_start"] = createdAt;
        if (event === "subscription_cancelled") patch["cancelled_at"] = new Date().toISOString();
        if (event === "subscription_resumed" || event === "subscription_unpaused")
          patch["cancelled_at"] = null;

        // Reset dei crediti al rinnovo del periodo (nessun riporto).
        if (isRenewalPayment) {
          patch["credits_used"] = 0;
          patch["current_period_start"] = new Date().toISOString();
        }

        if (existing) {
          const { error } = await supabaseAdmin
            .from("subscriptions")
            .update(patch as never)
            .eq("id", existing.id);
          if (error) {
            logger.error("lemon-webhook: subscription update failed", {
              error: error.message,
              event,
              lsSubscriptionId,
            });
            return new Response("db error", { status: 500 });
          }
        } else {
          const { error } = await supabaseAdmin.from("subscriptions").insert(patch as never);
          if (error) {
            logger.error("lemon-webhook: subscription insert failed", {
              error: error.message,
              event,
              lsSubscriptionId,
            });
            return new Response("db error", { status: 500 });
          }
        }

        // Bonus Starter: una sola volta per utente, mai al rinnovo o riattivazione.
        if (event === "subscription_created" && planSlug === "starter") {
          const { error: bonusError } = await supabaseAdmin.rpc("grant_starter_bonus", {
            _user_id: resolvedUserId,
            _amount: STARTER_BONUS_CREDITS,
          });
          if (bonusError)
            logger.error("lemon-webhook: bonus error", {
              error: bonusError.message,
              userId: resolvedUserId,
            });
        }

        // Ledger pagamenti: una riga per ogni fattura di abbonamento riuscita/fallita, così
        // /admin/payments mostra la cronologia reale invece di derivarla solo dallo stato corrente.
        if (event === "subscription_payment_success" || event === "subscription_payment_failed") {
          const invoiceId = payload.data?.id;
          if (invoiceId) {
            const totalCents = attrs["total"];
            const { data: subRow } = await supabaseAdmin
              .from("subscriptions")
              .select("id")
              .eq("lemon_squeezy_subscription_id", lsSubscriptionId)
              .maybeSingle();
            const { error: payError } = await supabaseAdmin.from("payments").upsert(
              {
                user_id: resolvedUserId,
                subscription_id: subRow?.id ?? null,
                provider: "lemon_squeezy",
                provider_payment_id: String(invoiceId),
                plan_slug: planSlug,
                amount: typeof totalCents === "number" ? totalCents / 100 : null,
                currency:
                  typeof attrs["currency"] === "string" ? (attrs["currency"] as string) : "EUR",
                status: event === "subscription_payment_success" ? "succeeded" : "failed",
                description: `Fattura abbonamento ${planSlug ?? ""}`.trim(),
              },
              { onConflict: "provider,provider_payment_id", ignoreDuplicates: true },
            );
            if (payError)
              logger.error("lemon-webhook: payments upsert (invoice) failed", {
                error: payError.message,
                invoiceId,
              });
          }
        }

        // Notifiche (architettura pronta, provider collegabile in seguito).
        if (event === "subscription_created")
          await dispatchNotification({ event: "subscription_confirmed", userId: resolvedUserId });
        if (event === "subscription_payment_success")
          await dispatchNotification({ event: "payment_success", userId: resolvedUserId });
        if (event === "subscription_payment_failed")
          await dispatchNotification({ event: "payment_failed", userId: resolvedUserId });
        if (event === "subscription_cancelled")
          await dispatchNotification({ event: "subscription_cancelled", userId: resolvedUserId });

        logger.info("lemon-webhook: event processed", { event, userId: resolvedUserId, planSlug });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
