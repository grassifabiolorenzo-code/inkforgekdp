import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sistema crediti centralizzato.
 * Tutta la logica critica (verifica abbonamento, limite, consumo, idempotenza)
 * è eseguita server-side tramite funzioni atomiche del database.
 */

export interface CreditState {
  has_subscription: boolean;
  active: boolean;
  status: string;
  plan: { slug: string; name: string; price: number } | null;
  unlimited: boolean;
  limit: number;
  used: number;
  bonus_remaining: number;
  /** Tool inclusi nel piano attivo. */
  allowed_tools?: string[];
  /** -1 = illimitato */
  remaining: number;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancelled_at?: string | null;
  subscription_id?: string | null;
}

export const getAccountState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;

    // Il profilo viene creato al primo accesso (nessun trigger su auth).
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    let ensured = profile;
    if (!ensured) {
      const { data: created } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: (claims as { email?: string }).email ?? null,
          name:
            ((claims as { user_metadata?: { name?: string; full_name?: string } }).user_metadata
              ?.name ??
              (claims as { user_metadata?: { full_name?: string } }).user_metadata?.full_name) ||
            null,
        })
        .select("*")
        .maybeSingle();
      ensured = created ?? null;
    }

    const { data: state, error } = await supabase.rpc("get_credit_state");
    if (error) throw new Error(error.message);

    return {
      profile: ensured,
      credits: state as unknown as CreditState,
    };
  });

export const getUsageBreakdown = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: usage }, { data: history }] = await Promise.all([
      supabase.from("usage").select("tool_id, usage_count, period_start").eq("user_id", userId),
      supabase
        .from("credit_transactions")
        .select("id, tool_id, amount, description, source, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const perTool: Record<string, number> = {};
    for (const row of usage ?? []) {
      perTool[row.tool_id] = (perTool[row.tool_id] ?? 0) + (row.usage_count ?? 0);
    }

    return { perTool, history: history ?? [] };
  });

const consumeInput = z.object({
  toolId: z.string().min(1),
  operationId: z.string().min(8).max(200),
  action: z.string().min(1),
  description: z.string().max(300).optional(),
});

export interface ConsumeResult {
  ok: boolean;
  duplicate?: boolean;
  reason?: "subscription_inactive" | "limit_reached" | "tool_not_in_plan";
  plan?: string;
  source?: string;
  state?: CreditState;
}

/**
 * Consuma esattamente 1 credito, solo se l'operazione è stata completata.
 * Idempotente per `operationId`: doppio click o retry non scalano due volte.
 */
export const consumeCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => consumeInput.parse(data))
  .handler(async ({ data, context }): Promise<ConsumeResult> => {
    const { supabase } = context;
    const { data: result, error } = await supabase.rpc("consume_credit", {
      _tool_id: data.toolId,
      _operation_id: data.operationId,
      _description: data.description ?? data.action,
    });
    if (error) throw new Error(error.message);
    return result as unknown as ConsumeResult;
  });

/** Verifica preventiva: l'utente può avviare un'operazione a pagamento? */
export const canConsume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_credit_state");
    if (error) throw new Error(error.message);
    const state = data as unknown as CreditState;
    return {
      allowed: state.active && (state.unlimited || state.remaining > 0),
      state,
    };
  });
