import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Progetto libro condiviso tra i tool: solo metadati qui (nome, path su
 * Storage, scadenza). I byte dei file non attraversano mai queste funzioni —
 * upload/download vanno direttamente dal browser a Supabase Storage tramite
 * il client lato client (vedi bookProjectStorage.ts), protetti dalla stessa
 * policy RLS "owner" della tabella. Self-service come privacy.functions.ts:
 * solo autenticazione, mai un target diverso dal chiamante.
 */
export const listMyBookProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("book_projects")
      .select("*")
      .eq("user_id", context.userId)
      .gt("expires_at", new Date().toISOString())
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  coverPath: z.string().max(500).nullable().optional(),
  coverMime: z.string().max(100).nullable().optional(),
  interiorPath: z.string().max(500).nullable().optional(),
});

/** 6 ore di scadenza scorrevole: si rinnova a ogni creazione/aggiornamento, mai fissa da quando è nato. */
const PROJECT_TTL_MS = 6 * 60 * 60 * 1000;

export const upsertBookProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertInput.parse(data))
  .handler(async ({ data, context }) => {
    const expiresAt = new Date(Date.now() + PROJECT_TTL_MS).toISOString();
    const row = {
      user_id: context.userId,
      name: data.name,
      ...(data.coverPath !== undefined ? { cover_path: data.coverPath } : {}),
      ...(data.coverMime !== undefined ? { cover_mime: data.coverMime } : {}),
      ...(data.interiorPath !== undefined ? { interior_path: data.interiorPath } : {}),
      expires_at: expiresAt,
    };

    const query = data.id
      ? context.supabase
          .from("book_projects")
          .update(row)
          .eq("id", data.id)
          .eq("user_id", context.userId)
      : context.supabase.from("book_projects").insert(row);

    const { data: saved, error } = await query.select("*").single();
    if (error) throw new Error(error.message);
    return saved;
  });

const projectIdInput = z.object({ id: z.string().uuid() });

/**
 * Elimina solo la riga: i file su Storage vanno rimossi lato client subito
 * prima (stesso proprietario, stessa RLS — nessun bisogno di service role qui).
 */
export const deleteBookProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => projectIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("book_projects")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
