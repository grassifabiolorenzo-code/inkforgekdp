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
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: {} });

    let identity: Awaited<ReturnType<typeof getMyAdminIdentity>>;
    try {
      identity = await getMyAdminIdentity();
    } catch {
      // Nessun ruolo admin (o sospeso): nessun accesso, redirect all'area utente normale.
      throw redirect({ to: "/dashboard" });
    }

    // Step-up MFA: se l'account ha un fattore TOTP verificato ma la sessione
    // corrente è solo aal1, va completata la verifica prima di procedere.
    // Se non ha ancora attivato il 2FA (nextLevel === currentLevel), si passa:
    // il periodo di grazia è gestito dal banner in AdminShell, non da un blocco.
    let needsStepUp = false;
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      needsStepUp = !!aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2";
    } catch {
      // Se il controllo stesso fallisce (es. MFA non abilitato sul progetto Supabase),
      // non blocchiamo l'accesso: la sicurezza reale sulle azioni critiche resta
      // comunque verificata server-side (vedi requireStepUpMfa).
      needsStepUp = false;
    }
    if (needsStepUp) {
      throw redirect({ to: "/admin-mfa-challenge", search: { redirect: location.href } });
    }

    return { user: data.user, adminRole: identity.role, adminEmail: identity.email };
  },
  component: () => <Outlet />,
});
