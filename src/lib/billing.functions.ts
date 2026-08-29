import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Server functions di billing: checkout, portale cliente, cancellazione. */

/**
 * Stato di configurazione dei pagamenti, letto lato server.
 * Espone solo booleani (mai i valori) e serve alla dashboard per
 * disabilitare i soli pulsanti di checkout quando mancano le credenziali.
 */
export const getBillingStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getBillingConfigStatus } = await import("./lemon-squeezy.server");
    return getBillingConfigStatus();
  });

const checkoutInput = z.object({
  planSlug: z.enum(["starter", "pro", "business"]),
  redirectUrl: z.string().url(),
});

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => checkoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const { createCheckoutUrl } = await import("./lemon-squeezy.server");
    const claims = context.claims as { email?: string; user_metadata?: { name?: string } };

    try {
      const url = await createCheckoutUrl({
        planSlug: data.planSlug,
        email: claims.email ?? null,
        name: claims.user_metadata?.name ?? null,
        userId: context.userId,
        redirectUrl: data.redirectUrl,
      });

      if (!url) {
        return {
          url: null as string | null,
          error: "Pagamenti non ancora configurati. Riprova più tardi." as string | null,
        };
      }
      return { url: url as string | null, error: null as string | null };
    } catch (err) {
      console.error("[billing] checkout failed", err);
      return {
        url: null as string | null,
        error: "Checkout non disponibile al momento." as string | null,
      };
    }
  });

export const getManageSubscriptionUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("lemon_squeezy_subscription_id, status")
      .eq("user_id", context.userId)
      .not("lemon_squeezy_subscription_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.lemon_squeezy_subscription_id) {
      return { url: null as string | null, reason: "no_subscription" as const };
    }

    const { getSubscriptionPortalUrls } = await import("./lemon-squeezy.server");
    const urls = await getSubscriptionPortalUrls(sub.lemon_squeezy_subscription_id);
    return { url: urls.customerPortal, reason: null };
  });

export const cancelMySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("lemon_squeezy_subscription_id")
      .eq("user_id", context.userId)
      .not("lemon_squeezy_subscription_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.lemon_squeezy_subscription_id) return { ok: false, reason: "no_subscription" };

    const { cancelSubscription } = await import("./lemon-squeezy.server");
    await cancelSubscription(sub.lemon_squeezy_subscription_id);
    // Lo stato reale viene aggiornato dal webhook subscription_cancelled.
    return { ok: true };
  });

const changePlanInput = z.object({ planSlug: z.enum(["starter", "pro", "business"]) });

/**
 * Upgrade/downgrade di un abbonamento già attivo.
 * Lo stato definitivo arriva dal webhook subscription_updated.
 */
export const changePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => changePlanInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("lemon_squeezy_subscription_id, status")
      .eq("user_id", context.userId)
      .not("lemon_squeezy_subscription_id", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.lemon_squeezy_subscription_id) {
      return { ok: false as const, reason: "no_subscription" as const };
    }

    const { readLemonConfig, updateSubscriptionVariant } = await import("./lemon-squeezy.server");
    const variantId = readLemonConfig().variants[data.planSlug];
    if (!variantId) {
      return { ok: false as const, reason: "variant_not_configured" as const };
    }

    await updateSubscriptionVariant(sub.lemon_squeezy_subscription_id, variantId);
    return { ok: true as const, reason: null };
  });
