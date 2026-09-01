import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CREDIT_PACK } from "@/config/plans";
import { enforceRateLimit } from "@/lib/rateLimit.server";

/** Limite comune per le azioni di billing: chiamano tutte l'API esterna di Lemon Squeezy. */
const BILLING_RATE_LIMIT = { maxHits: 10, windowSeconds: 60 };

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
    const { createCheckoutUrl, getBillingConfigStatus } = await import("./lemon-squeezy.server");
    const claims = context.claims as { email?: string; user_metadata?: { name?: string } };

    // Validazione preventiva: blocca solo il checkout, senza errori runtime.
    const status = getBillingConfigStatus();
    if (!status.apiKey || !status.storeId || !status.variants[data.planSlug]) {
      return {
        url: null as string | null,
        error: "Pagamenti non ancora configurati. Riprova più tardi." as string | null,
      };
    }

    try {
      await enforceRateLimit(`checkout:${context.userId}`, BILLING_RATE_LIMIT);

      // Sconto 30% primo mese per chi arriva da referral: solo finché il referral risulta ancora
      // REGISTERED (mai pagato prima) — dopo la prima conversione lo stato passa ad ACTIVE e lo
      // sconto non si applica più, anche a un eventuale nuovo checkout futuro.
      let discountCode: string | undefined;
      const { data: referral } = await context.supabase
        .from("referrals")
        .select("status")
        .eq("referred_user_id", context.userId)
        .maybeSingle();
      if (referral?.status === "REGISTERED") {
        const { getReferralDiscountCode } = await import("./lemon-squeezy.server");
        discountCode = getReferralDiscountCode() ?? undefined;
      }

      const url = await createCheckoutUrl({
        planSlug: data.planSlug,
        email: claims.email ?? null,
        name: claims.user_metadata?.name ?? null,
        userId: context.userId,
        redirectUrl: data.redirectUrl,
        ...(discountCode ? { discountCode } : {}),
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
      const message =
        err instanceof Error && err.message.startsWith("Troppe richieste") ? err.message : null;
      return {
        url: null as string | null,
        error: (message ?? "Checkout non disponibile al momento.") as string | null,
      };
    }
  });

const creditPackCheckoutInput = z.object({ redirectUrl: z.string().url() });

/**
 * Checkout one-time (non abbonamento) per il pacchetto crediti extra. Non tocca la
 * sottoscrizione esistente: i crediti vengono accreditati dal webhook su "order_created".
 */
export const createCreditPackCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => creditPackCheckoutInput.parse(data))
  .handler(async ({ data, context }) => {
    const { createCheckoutUrl, getBillingConfigStatus } = await import("./lemon-squeezy.server");
    const claims = context.claims as { email?: string; user_metadata?: { name?: string } };

    const status = getBillingConfigStatus();
    if (!status.creditPackReady) {
      return {
        url: null as string | null,
        error: "Pacchetto crediti non ancora configurato. Riprova più tardi." as string | null,
      };
    }

    try {
      await enforceRateLimit(`checkout:${context.userId}`, BILLING_RATE_LIMIT);

      const url = await createCheckoutUrl({
        planSlug: CREDIT_PACK.id,
        email: claims.email ?? null,
        name: claims.user_metadata?.name ?? null,
        userId: context.userId,
        redirectUrl: data.redirectUrl,
        extraCustomData: { purchase_type: "credit_pack", credits: String(CREDIT_PACK.credits) },
      });

      if (!url) {
        return {
          url: null as string | null,
          error: "Pacchetto crediti non ancora configurato. Riprova più tardi." as string | null,
        };
      }
      return { url: url as string | null, error: null as string | null };
    } catch (err) {
      console.error("[billing] credit pack checkout failed", err);
      const message =
        err instanceof Error && err.message.startsWith("Troppe richieste") ? err.message : null;
      return {
        url: null as string | null,
        error: (message ?? "Checkout non disponibile al momento.") as string | null,
      };
    }
  });

export const getManageSubscriptionUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await enforceRateLimit(`billing-portal:${context.userId}`, BILLING_RATE_LIMIT);

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
    await enforceRateLimit(`billing-cancel:${context.userId}`, BILLING_RATE_LIMIT);

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
    await enforceRateLimit(`billing-change-plan:${context.userId}`, BILLING_RATE_LIMIT);

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

    const { getBillingConfigStatus, readLemonConfig, updateSubscriptionVariant } =
      await import("./lemon-squeezy.server");
    const status = getBillingConfigStatus();
    if (!status.apiKey || !status.storeId || !status.variants[data.planSlug]) {
      return { ok: false as const, reason: "variant_not_configured" as const };
    }
    const variantId = readLemonConfig().variants[data.planSlug];
    if (!variantId) {
      return { ok: false as const, reason: "variant_not_configured" as const };
    }

    await updateSubscriptionVariant(sub.lemon_squeezy_subscription_id, variantId);
    return { ok: true as const, reason: null };
  });
