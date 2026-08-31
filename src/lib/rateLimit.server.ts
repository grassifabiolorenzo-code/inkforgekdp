import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logger } from "@/lib/logger.server";

/**
 * Rate limiting generico a finestra fissa (vedi check_rate_limit in Postgres).
 * Lancia se il limite è superato: usarlo come guardia in testa a un handler,
 * es. `await enforceRateLimit(\`checkout:\${userId}\`, { maxHits: 5, windowSeconds: 60 })`.
 */
export async function enforceRateLimit(
  key: string,
  opts: { maxHits: number; windowSeconds: number },
): Promise<void> {
  const { data: allowed, error } = await supabaseAdmin.rpc("check_rate_limit", {
    _key: key,
    _max_hits: opts.maxHits,
    _window_seconds: opts.windowSeconds,
  });

  if (error) {
    // Un errore infrastrutturale nel rate limiter non deve mai bloccare un utente legittimo:
    // si logga e si lascia passare, il vero controllo di sicurezza resta il permesso RBAC/RLS.
    logger.error("rate-limit: check fallito, richiesta consentita per fail-open", {
      key,
      error: error.message,
    });
    return;
  }

  if (!allowed) {
    logger.warn("rate-limit: limite superato", { key, ...opts });
    throw new Error("Troppe richieste. Riprova tra qualche istante.");
  }
}
