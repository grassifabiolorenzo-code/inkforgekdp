import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ReferralDashboard {
  referral_code: string | null;
  active_direct_referrals: number;
  plan_slug: string | null;
  plan_name: string | null;
  current_price: number | null;
  base_price: number | null;
  max_discount_referrals: number | null;
  next_threshold: number | null;
  next_price: number | null;
  referrals_needed_for_next: number | null;
  current_cycle_number: number;
  current_cycle_progress: number;
  cycle_length: number;
  total_referrals: number;
  active_referrals_list: {
    id: string;
    status: string;
    position_in_cycle: number | null;
    cycle_number: number | null;
    reward_credits: number;
    activated_at: string | null;
    created_at: string;
    referred_email: string | null;
  }[];
}

/**
 * Stato referral del chiamante: codice personale (generato al volo se manca),
 * conteggio attivi, prezzo Pro corrente/prossimo, progressione ciclo.
 */
export const getMyReferralDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // ensure_referral_code è service-role-only (accetta un _user_id arbitrario:
    // esporla a "authenticated" permetterebbe di assegnare codici ad altri utenti).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("ensure_referral_code", { _user_id: userId });

    // get_referral_dashboard non accetta parametri: usa auth.uid() internamente,
    // quindi il client RLS-scoped può chiamarla senza rischio di IDOR.
    const { data, error } = await supabase.rpc("get_referral_dashboard");
    if (error) throw new Error(error.message);
    return data as unknown as ReferralDashboard;
  });
