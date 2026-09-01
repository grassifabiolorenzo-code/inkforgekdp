import { logger } from "@/lib/logger.server";

/**
 * Applica su Lemon Squeezy il prezzo Pro calcolato dal referral, se e solo se:
 *  - l'utente ha un abbonamento Pro REALMENTE attivo (condizione di
 *    mantenimento: il beneficio non sopravvive alla cancellazione del Pro);
 *  - il calcolo risulta "da sincronizzare" (pending_sync);
 *  - esiste un variant Lemon Squeezy configurato per quel prezzo esatto.
 * Se una di queste condizioni manca, la funzione non fa nulla e non solleva
 * errori: pending_sync resta true e si ritenterà al prossimo evento di
 * billing/referral per lo stesso utente. Questo permette al sistema referral
 * di funzionare pienamente (crediti, cicli, conteggi) anche prima che
 * l'account Lemon Squeezy sia configurato.
 */
export async function syncProReferralPricing(userId: string): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: pricing } = await supabaseAdmin
    .from("pro_referral_pricing")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!pricing || !pricing.pending_sync) return;

  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("lemon_squeezy_subscription_id, plan_id, status")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!sub?.lemon_squeezy_subscription_id) return;
  if (sub.status !== "active" && sub.status !== "on_trial") return;

  const { data: plan } = await supabaseAdmin
    .from("plans")
    .select("slug")
    .eq("id", sub.plan_id ?? "")
    .maybeSingle();
  if (plan?.slug !== "pro") return; // il beneficio referral riguarda solo il piano Pro

  const priceKey = String(Math.round(pricing.effective_price));
  const { readProReferralPriceVariants, updateSubscriptionVariant } =
    await import("@/lib/lemon-squeezy.server");
  const variantId = readProReferralPriceVariants()[priceKey];

  if (!variantId) {
    logger.warn("referral: variant Lemon Squeezy non configurato per il prezzo Pro referral", {
      userId,
      price: priceKey,
    });
    return;
  }

  try {
    await updateSubscriptionVariant(sub.lemon_squeezy_subscription_id, variantId);
    await supabaseAdmin.rpc("mark_pro_pricing_synced", {
      _user_id: userId,
      _applied_price: pricing.effective_price,
      _variant_id: variantId,
    });

    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");
    await writeAuditLog({
      adminId: null,
      adminEmail: null,
      action: "PRO_REFERRAL_PRICE_UPDATED",
      targetType: "user",
      targetId: userId,
      metadata: {
        price: pricing.effective_price,
        active_referrals: pricing.active_direct_referrals,
      },
    });
  } catch (err) {
    logger.error("referral: aggiornamento variant Lemon Squeezy fallito", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
