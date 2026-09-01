import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { enforceRateLimit } from "@/lib/rateLimit.server";

const tokenInput = z.object({ token: z.string().uuid() });

/**
 * Disiscrizione via link nelle email promozionali: pubblica, nessuna
 * autenticazione (il token stesso è la prova di identità, come un link di
 * reset password). Vedi process_unsubscribe() per la logica di ricerca
 * lead/profilo.
 */
export const processUnsubscribe = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenInput.parse(data))
  .handler(async ({ data }) => {
    await enforceRateLimit(`unsubscribe:${data.token}`, { maxHits: 10, windowSeconds: 3600 });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("process_unsubscribe", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);

    return { kind: result as "lead" | "profile" | "not_found" };
  });
