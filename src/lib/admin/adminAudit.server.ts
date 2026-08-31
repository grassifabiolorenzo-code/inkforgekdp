import { getRequest } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";

/**
 * Scrittura dell'audit log. Unico punto di scrittura della tabella
 * `audit_logs` (append-only: nessuna funzione espone update/delete).
 * File `.server.ts`: mai incluso nel bundle client (vedi client.server.ts).
 */
export async function writeAuditLog(entry: {
  adminId: string | null;
  adminEmail: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  result?: "success" | "failure";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  let ip: string | null = null;
  let userAgent: string | null = null;
  try {
    const request = getRequest();
    ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    userAgent = request?.headers.get("user-agent") ?? null;
  } catch {
    // Il contesto richiesta potrebbe non essere disponibile in ogni chiamata: non blocca il log.
  }

  const { error } = await supabaseAdmin.from("audit_logs").insert({
    admin_id: entry.adminId,
    admin_email: entry.adminEmail,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    result: entry.result ?? "success",
    ip,
    user_agent: userAgent,
    metadata: (entry.metadata ?? {}) as Json,
  });

  if (error) console.error("[audit-log] scrittura fallita", entry.action, error.message);
}
