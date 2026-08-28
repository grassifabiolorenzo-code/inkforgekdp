import { createFileRoute } from "@tanstack/react-router";

import { STARTER_BONUS_CREDITS } from "@/config/plans";

/**
 * Webhook Lemon Squeezy — unica fonte di verità per lo stato dell'abbonamento.
 * La firma viene verificata prima di qualsiasi scrittura.
 */

interface LemonWebhook {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string; plan_slug?: string };
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

        const { verifyWebhookSignature, planSlugForVariant } = await import(
          "@/lib/lemon-squeezy.server"
        );

        let valid = false;
        try {
          valid = await verifyWebhookSignature(raw, signature);
        } catch (error) {
          console.error("[lemon-webhook] config error", error);
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
        if (!ACTIVE_EVENTS.has(event)) return new Response("ignored", { status: 200 });

        const attrs = payload.data?.attributes ?? {};
        const userId = payload.meta?.custom_data?.user_id ?? null;
        const lsSubscriptionId = String(
          (event.startsWith("subscription_payment") ? attrs["subscription_id"] : payload.data?.id) ??
            "",
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
          console.error("[lemon-webhook] utente non identificato", { event, lsSubscriptionId });
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
            console.error("[lemon-webhook] update failed", error.message);
            return new Response("db error", { status: 500 });
          }
        } else {
          const { error } = await supabaseAdmin.from("subscriptions").insert(patch as never);
          if (error) {
            console.error("[lemon-webhook] insert failed", error.message);
            return new Response("db error", { status: 500 });
          }
        }

        // Bonus Starter: una sola volta per utente, mai al rinnovo o riattivazione.
        if (event === "subscription_created" && planSlug === "starter") {
          const { error: bonusError } = await supabaseAdmin.rpc("grant_starter_bonus", {
            _user_id: resolvedUserId,
            _amount: STARTER_BONUS_CREDITS,
          });
          if (bonusError) console.error("[lemon-webhook] bonus error", bonusError.message);
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

        return new Response("ok", { status: 200 });
      },
    },
  },
});
