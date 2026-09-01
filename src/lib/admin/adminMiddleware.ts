import { createMiddleware } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { can, type AdminAction, type AdminResource, type AdminRole } from "@/lib/adminRbac";

/**
 * Verifica server-side del ruolo admin (mai fidarsi del frontend). Compone
 * `requireSupabaseAuth` (autenticazione) e aggiunge:
 *  1. il bootstrap idempotente del SUPER_ADMIN principale, se l'email del
 *     chiamante coincide con SUPER_ADMIN_EMAIL;
 *  2. la lettura del ruolo admin del chiamante (RLS: un utente può leggere
 *     solo la propria riga in admin_roles — vedi migration);
 *  3. il blocco (403) se non esiste alcun ruolo admin o è sospeso.
 */
export const requireAdminRole = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string }).email ?? null;

    const superAdminEmail = process.env["SUPER_ADMIN_EMAIL"];
    if (
      superAdminEmail &&
      email &&
      email.trim().toLowerCase() === superAdminEmail.trim().toLowerCase()
    ) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.rpc("ensure_super_admin", { _user_id: userId });
      if (error) console.error("[admin] bootstrap super admin fallito", error.message);
    }

    const { data: adminRow, error: roleError } = await supabase
      .from("admin_roles")
      .select("role, suspended")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) throw new Error("Errore nella verifica del ruolo amministrativo");
    if (!adminRow || adminRow.suspended) {
      throw new Error("FORBIDDEN: accesso amministrativo non autorizzato");
    }

    // Traccia l'ultimo accesso admin (best-effort, non blocca la richiesta se fallisce).
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    void supabaseAdmin
      .from("admin_roles")
      .update({ last_login_at: new Date().toISOString() })
      .eq("user_id", userId)
      .then(({ error }) => {
        if (error) console.error("[admin] aggiornamento last_login_at fallito", error.message);
      });

    return next({
      context: {
        ...context,
        adminRole: adminRow.role as AdminRole,
        adminEmail: email,
      },
    });
  });

/**
 * Middleware con permesso granulare: da usare in ogni server function admin,
 * es. `.middleware([requirePermission("users", "write")])`.
 */
export function requirePermission(resource: AdminResource, action: AdminAction) {
  return createMiddleware({ type: "function" })
    .middleware([requireAdminRole])
    .server(async ({ next, context }) => {
      if (!can(context.adminRole, resource, action)) {
        throw new Error(`FORBIDDEN: permesso mancante (${resource}:${action})`);
      }
      return next({ context });
    });
}

/**
 * Richiede una sessione aal2 (verifica in due passaggi completata), senza
 * eccezioni. A differenza del guard client-side in `_admin/route.tsx` — che
 * concede un periodo di grazia a chi non ha ancora attivato il 2FA — qui non
 * c'è periodo di grazia: da usare solo per le azioni più pericolose e
 * irreversibili (gestione di altri amministratori, eliminazione di un
 * account utente), dove vale la pena bloccare anche il primissimo utilizzo
 * finché il chiamante non ha attivato il 2FA su /admin/security.
 */
export function requireStepUpMfa(resource: AdminResource, action: AdminAction) {
  return createMiddleware({ type: "function" })
    .middleware([requirePermission(resource, action)])
    .server(async ({ next, context }) => {
      const aal = (context.claims as { aal?: string }).aal;
      if (aal !== "aal2") {
        throw new Error(
          "FORBIDDEN: questa azione richiede la verifica in due passaggi (2FA) attiva. Attivala in Admin → Sicurezza.",
        );
      }
      return next({ context });
    });
}
