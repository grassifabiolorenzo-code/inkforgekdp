import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "@/lib/rateLimit.server";

/**
 * Autoservizio privacy (diritto alla portabilità/cancellazione dei dati, GDPR
 * art. 15/17): esporta o elimina i dati DEL CHIAMANTE, mai di terzi — a
 * differenza delle funzioni admin, qui non serve alcun ruolo speciale, solo
 * essere autenticati come il proprietario dei dati.
 */
export const exportMyData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await enforceRateLimit(`export-data:${context.userId}`, { maxHits: 5, windowSeconds: 3600 });

    const { supabase, userId } = context;

    const [profile, subscriptions, usage, creditTransactions] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("subscriptions").select("*").eq("user_id", userId),
      supabase.from("usage").select("*").eq("user_id", userId),
      supabase.from("credit_transactions").select("*").eq("user_id", userId),
    ]);

    // payments non ha una policy RLS per authenticated (solo service_role): l'accesso
    // ai propri pagamenti passa da qui, con un filtro rigido sul proprio user_id.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", userId);

    return {
      exportedAt: new Date().toISOString(),
      profile: profile.data ?? null,
      subscriptions: subscriptions.data ?? [],
      usage: usage.data ?? [],
      creditTransactions: creditTransactions.data ?? [],
      payments: payments ?? [],
    };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await enforceRateLimit(`delete-account:${context.userId}`, { maxHits: 3, windowSeconds: 3600 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");
    const email = (context.claims as { email?: string }).email ?? null;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);

    await writeAuditLog({
      adminId: null,
      adminEmail: email,
      action: "USER_SELF_DELETED",
      targetType: "user",
      targetId: context.userId,
      result: error ? "failure" : "success",
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
