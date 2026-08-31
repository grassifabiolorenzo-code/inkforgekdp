import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { getMyAdminIdentity } from "@/lib/admin/dashboard.functions";

/**
 * Layout `/admin`: verifica autenticazione E ruolo amministrativo.
 * Il controllo qui è solo UX (evita di montare la UI admin e fare redirect
 * prima ancora di caricare dati): la vera protezione è server-side — ogni
 * server function admin richiama `requirePermission(...)`, che verifica il
 * ruolo nel database indipendentemente da questo guard. Un utente normale
 * non può in alcun modo ottenere dati admin anche bypassando questo layout.
 */
export const Route = createFileRoute("/_admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: {} });

    try {
      const identity = await getMyAdminIdentity();
      return { user: data.user, adminRole: identity.role, adminEmail: identity.email };
    } catch {
      // Nessun ruolo admin (o sospeso): nessun accesso, redirect all'area utente normale.
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
