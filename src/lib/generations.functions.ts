import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

/**
 * Cronologia delle generazioni di testo (Pubblicazione, Blurb, Bio, Promo):
 * salva l'output di ogni generazione già pagata così un utente che chiude la
 * scheda senza copiare/scaricare può ritrovarlo senza pagare di nuovo.
 * Self-service come bookProjects.functions.ts: solo autenticazione, mai un
 * target diverso dal chiamante. La tabella si auto-limita a 30 voci per
 * utente/tool tramite un trigger DB (vedi la migration), non serve farlo qui.
 */
const TOOL_IDS = ["pubblicazione", "blurb", "bio", "promo"] as const;
export type GenerationToolId = (typeof TOOL_IDS)[number];

const listInput = z.object({
  toolId: z.enum(TOOL_IDS),
});

export const listMyGenerations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => listInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("generations")
      .select("*")
      .eq("user_id", context.userId)
      .eq("tool_id", data.toolId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

// Limite di dimensione generoso ma non illimitato: un output di testo (anche
// con più varianti/paragrafi) non supera mai qualche decina di KB in JSON —
// questo blocca solo un payload anomalo, non un output legittimo.
const jsonSizeLimit = (data: unknown, max: number) => JSON.stringify(data).length <= max;

const saveInput = z.object({
  toolId: z.enum(TOOL_IDS),
  title: z.string().trim().min(1).max(200),
  locale: z.string().trim().min(2).max(10),
  input: z.unknown().refine((v) => jsonSizeLimit(v, 20_000), "Input troppo grande"),
  output: z.unknown().refine((v) => jsonSizeLimit(v, 50_000), "Output troppo grande"),
});

export const saveGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: saved, error } = await context.supabase
      .from("generations")
      .insert({
        user_id: context.userId,
        tool_id: data.toolId,
        title: data.title,
        locale: data.locale,
        input: data.input as Json,
        output: data.output as Json,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

const deleteInput = z.object({ id: z.string().uuid() });

export const deleteGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => deleteInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("generations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
