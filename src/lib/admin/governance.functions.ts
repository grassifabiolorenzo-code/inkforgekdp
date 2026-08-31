import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";
import { ADMIN_ROLES } from "@/lib/adminRbac";

/* -------------------------------------------------------------------------- */
/* AMMINISTRATORI — solo SUPER_ADMIN (vedi adminRbac.ts: "administrators" è   */
/* concesso solo al ruolo super_admin). Protezioni anti privilege-escalation: */
/* - un ADMIN non può nemmeno chiamare questi endpoint (permesso mancante);   */
/* - non si può degradare/sospendere l'ultimo super_admin rimasto;           */
/* - l'email di bootstrap (SUPER_ADMIN_EMAIL) non può essere rimossa/degradata */
/*   da altri super admin: resta sempre il proprietario del SaaS.            */
/* -------------------------------------------------------------------------- */

export const listAdministrators = createServerFn({ method: "GET" })
  .middleware([requirePermission("administrators", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_roles")
      .select("user_id, role, suspended, last_login_at, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const ids = (data ?? []).map((r) => r.user_id);
    const emails = new Map<string, string>();
    await Promise.all(
      ids.map(async (id) => {
        const { data: u } = await supabaseAdmin.auth.admin.getUserById(id);
        if (u.user?.email) emails.set(id, u.user.email);
      }),
    );

    return (data ?? []).map((row) => ({ ...row, email: emails.get(row.user_id) ?? null }));
  });

const addAdminInput = z.object({ email: z.string().email(), role: z.enum(ADMIN_ROLES) });

export const addAdministrator = createServerFn({ method: "POST" })
  .middleware([requirePermission("administrators", "write")])
  .inputValidator((data: unknown) => addAdminInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: userId, error: lookupError } = await supabaseAdmin.rpc(
      "admin_find_user_id_by_email",
      {
        _email: data.email,
      },
    );
    if (lookupError) throw new Error(lookupError.message);
    if (!userId) {
      throw new Error(
        "Nessun account registrato con questa email: l'utente deve prima creare un account.",
      );
    }

    const { error } = await supabaseAdmin
      .from("admin_roles")
      .upsert({ user_id: userId, role: data.role, granted_by: context.userId, suspended: false });

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "ROLE_CHANGED",
      targetType: "admin",
      targetId: userId,
      result: error ? "failure" : "success",
      metadata: { role: data.role, email: data.email },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const adminUserIdInput = z.object({ userId: z.string().uuid() });

async function assertNotLastSuperAdmin(
  supabaseAdmin: (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"],
  targetUserId: string,
) {
  const { data: target } = await supabaseAdmin
    .from("admin_roles")
    .select("role")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (target?.role !== "super_admin") return;

  const { count } = await supabaseAdmin
    .from("admin_roles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("suspended", false);
  if ((count ?? 0) <= 1) {
    throw new Error("Non è possibile rimuovere l'ultimo Super Admin rimasto.");
  }
}

async function assertNotBootstrapSuperAdmin(
  supabaseAdmin: (typeof import("@/integrations/supabase/client.server"))["supabaseAdmin"],
  targetUserId: string,
) {
  const bootstrapEmail = process.env["SUPER_ADMIN_EMAIL"];
  if (!bootstrapEmail) return;
  const { data: u } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
  if (u.user?.email?.trim().toLowerCase() === bootstrapEmail.trim().toLowerCase()) {
    throw new Error(
      "Questo account è il Super Admin principale del SaaS e non può essere modificato da qui.",
    );
  }
}

const updateAdminRoleInput = z.object({ userId: z.string().uuid(), role: z.enum(ADMIN_ROLES) });

export const updateAdministratorRole = createServerFn({ method: "POST" })
  .middleware([requirePermission("administrators", "write")])
  .inputValidator((data: unknown) => updateAdminRoleInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    await assertNotBootstrapSuperAdmin(supabaseAdmin, data.userId);
    if (data.role !== "super_admin") await assertNotLastSuperAdmin(supabaseAdmin, data.userId);

    const { error } = await supabaseAdmin
      .from("admin_roles")
      .update({ role: data.role })
      .eq("user_id", data.userId);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "ROLE_CHANGED",
      targetType: "admin",
      targetId: data.userId,
      result: error ? "failure" : "success",
      metadata: { role: data.role },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const suspendAdministrator = createServerFn({ method: "POST" })
  .middleware([requirePermission("administrators", "write")])
  .inputValidator((data: unknown) => adminUserIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    await assertNotBootstrapSuperAdmin(supabaseAdmin, data.userId);
    await assertNotLastSuperAdmin(supabaseAdmin, data.userId);

    const { error } = await supabaseAdmin
      .from("admin_roles")
      .update({ suspended: true })
      .eq("user_id", data.userId);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "ADMIN_SUSPENDED",
      targetType: "admin",
      targetId: data.userId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeAdministrator = createServerFn({ method: "POST" })
  .middleware([requirePermission("administrators", "delete")])
  .inputValidator((data: unknown) => adminUserIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    await assertNotBootstrapSuperAdmin(supabaseAdmin, data.userId);
    await assertNotLastSuperAdmin(supabaseAdmin, data.userId);

    const { error } = await supabaseAdmin.from("admin_roles").delete().eq("user_id", data.userId);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "ADMIN_REMOVED",
      targetType: "admin",
      targetId: data.userId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* FEATURE FLAGS                                                              */
/* -------------------------------------------------------------------------- */

export const listFeatureFlags = createServerFn({ method: "GET" })
  .middleware([requirePermission("features", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("feature_flags").select("*").order("key");
    if (error) throw new Error(error.message);
    return data;
  });

const upsertFlagInput = z.object({
  id: z.string().uuid().optional(),
  key: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[A-Z0-9_]+$/, "Usa solo maiuscole, numeri e underscore"),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  enabled: z.boolean(),
  enabledForAll: z.boolean(),
  enabledPlans: z.array(z.string()).default([]),
  enabledUserIds: z.array(z.string().uuid()).default([]),
});

export const upsertFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requirePermission("features", "write")])
  .inputValidator((data: unknown) => upsertFlagInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const payload = {
      key: data.key,
      name: data.name,
      description: data.description ?? null,
      enabled: data.enabled,
      enabled_for_all: data.enabledForAll,
      enabled_plans: data.enabledPlans,
      enabled_user_ids: data.enabledUserIds,
    };

    const { error } = data.id
      ? await supabaseAdmin.from("feature_flags").update(payload).eq("id", data.id)
      : await supabaseAdmin.from("feature_flags").insert(payload);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "SETTING_CHANGED",
      targetType: "feature_flag",
      targetId: data.id ?? data.key,
      result: error ? "failure" : "success",
      metadata: payload,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFeatureFlag = createServerFn({ method: "POST" })
  .middleware([requirePermission("features", "delete")])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin.from("feature_flags").delete().eq("id", data.id);
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "SETTING_CHANGED",
      targetType: "feature_flag",
      targetId: data.id,
      result: error ? "failure" : "success",
      metadata: { deleted: true },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* AUDIT LOGS — sola lettura                                                  */
/* -------------------------------------------------------------------------- */

const listAuditInput = z.object({
  action: z.string().max(60).optional(),
  targetType: z.string().max(60).optional(),
  adminEmail: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const listAuditLogs = createServerFn({ method: "GET" })
  .middleware([requirePermission("audit_logs", "read")])
  .inputValidator((data: unknown) => listAuditInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data.action) query = query.eq("action", data.action);
    if (data.targetType) query = query.eq("target_type", data.targetType);
    if (data.adminEmail) query = query.ilike("admin_email", `%${data.adminEmail}%`);

    const { data: rows, error, count } = await query;
    if (error) throw new Error(error.message);
    return { logs: rows ?? [], totalCount: count ?? 0, page: data.page, pageSize: data.pageSize };
  });

/* -------------------------------------------------------------------------- */
/* SETTINGS — impostazioni non sensibili in system_settings (mai secret)      */
/* -------------------------------------------------------------------------- */

const GENERAL_SETTINGS_KEY = "general";

const generalSettingsSchema = z.object({
  saasName: z.string().min(1).max(100),
  supportEmail: z.string().email(),
  publicUrl: z.string().url(),
});

export const getAdminGeneralSettings = createServerFn({ method: "GET" })
  .middleware([requirePermission("settings", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", GENERAL_SETTINGS_KEY)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.value as z.infer<typeof generalSettingsSchema> | undefined) ?? null;
  });

export const updateAdminGeneralSettings = createServerFn({ method: "POST" })
  .middleware([requirePermission("settings", "write")])
  .inputValidator((data: unknown) => generalSettingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin.from("system_settings").upsert({
      key: GENERAL_SETTINGS_KEY,
      value: data,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "SETTING_CHANGED",
      targetType: "system_settings",
      targetId: GENERAL_SETTINGS_KEY,
      result: error ? "failure" : "success",
      metadata: data,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------------------------------------------------------------------------- */
/* SYSTEM HEALTH — nessun secret esposto, solo stato/latenza/booleani         */
/* -------------------------------------------------------------------------- */

export const getSystemHealth = createServerFn({ method: "GET" })
  .middleware([requirePermission("system", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getBillingConfigStatus } = await import("@/lib/lemon-squeezy.server");

    const dbStart = Date.now();
    const { error: dbError } = await supabaseAdmin.rpc("admin_db_ping");
    const dbLatencyMs = Date.now() - dbStart;

    const billing = getBillingConfigStatus();

    return {
      checkedAt: new Date().toISOString(),
      database: {
        status: dbError ? "down" : "operational",
        latencyMs: dbLatencyMs,
        error: dbError?.message ?? null,
      },
      authentication: { status: "operational" as const },
      paymentProvider: {
        status: billing.ready ? "operational" : "not_configured",
        provider: "Lemon Squeezy",
        configured: billing.ready,
      },
      emailProvider: {
        status: "not_configured" as const,
        note: "Nessun provider email transazionale collegato: le notifiche vengono solo registrate nei log del server.",
      },
      aiText: {
        status: process.env["GEMINI_API_KEY"] ? "operational" : "not_configured",
        provider: "Gemini",
      },
      environment: process.env["NODE_ENV"] ?? "production",
    };
  });
