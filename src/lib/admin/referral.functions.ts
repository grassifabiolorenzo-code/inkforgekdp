import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";

const listInput = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.string().max(40).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listAdminReferrals = createServerFn({ method: "GET" })
  .middleware([requirePermission("referrals", "read")])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const offset = (data.page - 1) * data.pageSize;

    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_referrals", {
      ...(data.search ? { _search: data.search } : {}),
      ...(data.status ? { _status: data.status } : {}),
      _limit: data.pageSize,
      _offset: offset,
    });
    if (error) throw new Error(error.message);

    const totalCount = rows?.[0]?.total_count ?? 0;
    return {
      referrals: (rows ?? []).map(({ total_count: _totalCount, ...row }) => row),
      totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

export const getReferralProgramKpis = createServerFn({ method: "GET" })
  .middleware([requirePermission("referrals", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("admin_referral_kpis");
    if (error) throw new Error(error.message);
    return data as {
      total_referrals: number;
      active_referrals: number;
      cancelled_referrals: number;
      pending_referrals: number;
      conversion_rate: number;
      total_credits_distributed: number;
      total_credits_clawed_back: number;
      cycles_completed: number;
      users_with_pro_discount: number;
      users_with_pro_free: number;
    };
  });

export const getSuspiciousReferrals = createServerFn({ method: "GET" })
  .middleware([requirePermission("referrals", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("admin_suspicious_referrals");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const suspendInput = z.object({
  referredUserId: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
});

/**
 * Sospensione manuale di un referral sospetto: nessuna modifica ai crediti già
 * erogati (una sospensione non è un rimborso), ma il referral smette subito
 * di contare come attivo per il calcolo del prezzo Pro del referrer. Ogni
 * azione è loggata in audit_logs — nessuna modifica manuale senza log, come
 * richiesto per il pannello admin.
 */
export const suspendReferral = createServerFn({ method: "POST" })
  .middleware([requirePermission("referrals", "write")])
  .inputValidator((data: unknown) => suspendInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: ref, error: fetchError } = await supabaseAdmin
      .from("referrals")
      .select("id, referrer_id, status")
      .eq("referred_user_id", data.referredUserId)
      .maybeSingle();
    if (fetchError || !ref) throw new Error("Referral non trovato");

    const { error } = await supabaseAdmin
      .from("referrals")
      .update({ status: "SUSPENDED" })
      .eq("id", ref.id);

    if (!error) {
      const { error: recomputeError } = await supabaseAdmin.rpc("recompute_referrer_pricing", {
        _referrer_id: ref.referrer_id,
      });
      if (!recomputeError) {
        const { syncProReferralPricing } = await import("@/lib/referral.server");
        await syncProReferralPricing(ref.referrer_id);
      }
    }

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "REFERRAL_SUSPENDED",
      targetType: "referral",
      targetId: ref.id,
      result: error ? "failure" : "success",
      metadata: { reason: data.reason, previous_status: ref.status },
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

const chargebackInput = z.object({ referredUserId: z.string().uuid() });

/**
 * Marcatura manuale di chargeback: Lemon Squeezy non garantisce un webhook
 * dedicato e affidabile per ogni chargeback, quindi resta un'azione
 * amministrativa esplicita (l'operatore la usa quando riceve la notifica dal
 * dashboard del provider). Storna i crediti erogati, come per un rimborso.
 */
export const markReferralChargeback = createServerFn({ method: "POST" })
  .middleware([requirePermission("referrals", "write")])
  .inputValidator((data: unknown) => chargebackInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: result, error } = await supabaseAdmin.rpc("refund_referral", {
      _referred_user_id: data.referredUserId,
      _new_status: "CHARGEBACK",
    });

    if (!error && result && (result as { ok?: boolean }).ok) {
      const referrerId = (result as { referrer_id?: string }).referrer_id;
      if (referrerId) {
        const { syncProReferralPricing } = await import("@/lib/referral.server");
        await syncProReferralPricing(referrerId);
      }
    }

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "REFERRAL_CHARGEBACK",
      targetType: "referral",
      targetId: data.referredUserId,
      result: error ? "failure" : "success",
      metadata: result as Record<string, unknown>,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
