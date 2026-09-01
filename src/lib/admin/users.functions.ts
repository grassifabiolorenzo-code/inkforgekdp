import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission, requireStepUpMfa } from "@/lib/admin/adminMiddleware";

/** Ban "permanente": Supabase Admin API non ha un valore letterale "per sempre", si usa una durata molto lunga. */
const PERMANENT_BAN_DURATION = "876000h";

const listInput = z.object({
  search: z.string().trim().max(200).optional(),
  role: z.string().max(40).optional(),
  planSlug: z.string().max(40).optional(),
  status: z.string().max(40).optional(),
  sort: z.enum(["created_at", "name", "email", "last_sign_in_at"]).default("created_at"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requirePermission("users", "read")])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const offset = (data.page - 1) * data.pageSize;

    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_users", {
      ...(data.search ? { _search: data.search } : {}),
      ...(data.role ? { _role: data.role } : {}),
      ...(data.planSlug ? { _plan_slug: data.planSlug } : {}),
      ...(data.status ? { _status: data.status } : {}),
      _sort: data.sort,
      _sort_dir: data.sortDir,
      _limit: data.pageSize,
      _offset: offset,
    });
    if (error) throw new Error(error.message);

    const totalCount = rows?.[0]?.total_count ?? 0;
    return {
      users: (rows ?? []).map(({ total_count: _totalCount, ...row }) => row),
      totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const userIdInput = z.object({ userId: z.string().uuid() });

export const getAdminUserDetail = createServerFn({ method: "GET" })
  .middleware([requirePermission("users", "read")])
  .inputValidator((data: unknown) => userIdInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: detail, error } = await supabaseAdmin.rpc("admin_get_user_detail", {
      _user_id: data.userId,
    });
    if (error) throw new Error(error.message);
    if (!detail) throw new Error("Utente non trovato");
    return detail;
  });

/**
 * Utilizzo per tool dell'utente: stessa aggregazione di getUsageBreakdown
 * (credits.functions.ts), mai replicata finora lato admin — un admin poteva
 * vedere solo il log grezzo delle transazioni, non un riepilogo per tool.
 */
export const getAdminUserToolUsage = createServerFn({ method: "GET" })
  .middleware([requirePermission("users", "read")])
  .inputValidator((data: unknown) => userIdInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usage, error } = await supabaseAdmin
      .from("usage")
      .select("tool_id, usage_count")
      .eq("user_id", data.userId);
    if (error) throw new Error(error.message);

    const perTool: Record<string, number> = {};
    for (const row of usage ?? []) {
      perTool[row.tool_id] = (perTool[row.tool_id] ?? 0) + (row.usage_count ?? 0);
    }
    return { perTool };
  });

const updateProfileInput = z.object({
  userId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
});

export const updateAdminUserProfile = createServerFn({ method: "POST" })
  .middleware([requirePermission("users", "write")])
  .inputValidator((data: unknown) => updateProfileInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ name: data.name })
      .eq("id", data.userId);
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "USER_UPDATED",
      targetType: "user",
      targetId: data.userId,
      result: error ? "failure" : "success",
      metadata: { field: "name", value: data.name },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const changePlanInput = z.object({
  userId: z.string().uuid(),
  planSlug: z.string().min(1).max(40),
});

/**
 * Cambio piano forzato dall'admin (non passa da Lemon Squeezy: utile per gestione manuale,
 * es. cortesia commerciale). Non tocca lemon_squeezy_subscription_id esistente: se l'utente ha
 * un abbonamento reale su Lemon Squeezy, il prossimo evento webhook potrebbe sovrascrivere questo
 * cambiamento — è un intervento amministrativo diretto sul nostro DB, non sul provider di pagamento.
 */
export const changeAdminUserPlan = createServerFn({ method: "POST" })
  .middleware([requirePermission("subscriptions", "write")])
  .inputValidator((data: unknown) => changePlanInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("id, slug")
      .eq("slug", data.planSlug)
      .maybeSingle();
    if (planError || !plan) throw new Error("Piano non valido");

    const { data: existing } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", data.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let error: { message: string } | null = null;
    if (existing) {
      ({ error } = await supabaseAdmin
        .from("subscriptions")
        .update({ plan_id: plan.id, status: "active" })
        .eq("id", existing.id));
    } else {
      ({ error } = await supabaseAdmin
        .from("subscriptions")
        .insert({ user_id: data.userId, plan_id: plan.id, status: "active" }));
    }

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "PLAN_CHANGED",
      targetType: "user",
      targetId: data.userId,
      result: error ? "failure" : "success",
      metadata: { plan_slug: data.planSlug },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const suspendAdminUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("users", "write")])
  .inputValidator((data: unknown) => userIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: PERMANENT_BAN_DURATION,
    });
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "USER_SUSPENDED",
      targetType: "user",
      targetId: data.userId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reactivateAdminUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("users", "write")])
  .inputValidator((data: unknown) => userIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: "none",
    });
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "USER_REACTIVATED",
      targetType: "user",
      targetId: data.userId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Elimina l'utente da Supabase Auth: il profilo/subscription/audit collegati vengono rimossi a
 * cascata (FK ON DELETE CASCADE su auth.users) tranne payments/audit_logs che restano per
 * conservare lo storico contabile e di sicurezza (user_id passa a NULL, ON DELETE SET NULL).
 */
export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireStepUpMfa("users", "delete")])
  .inputValidator((data: unknown) => userIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const email = userRow.user?.email ?? null;

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);

    if (!error) {
      const { eraseUserMarketingData } = await import("@/lib/gdprErasure.server");
      await eraseUserMarketingData(supabaseAdmin, data.userId, email);
    }

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "USER_DELETED",
      targetType: "user",
      targetId: data.userId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Genera un link di reset password tramite l'auth server integrato di Supabase (funziona anche
 * senza un provider email applicativo configurato: è l'auth server, non il nostro notifications.server.ts).
 * Il link va copiato/inviato manualmente dall'admin finché non è collegato un provider email dedicato.
 */
export const generatePasswordResetLink = createServerFn({ method: "POST" })
  .middleware([requirePermission("users", "write")])
  .inputValidator((data: unknown) => userIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: userRow, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      data.userId,
    );
    if (userError || !userRow.user?.email) throw new Error("Email utente non disponibile");

    const { data: linkData, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: userRow.user.email,
    });

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "PASSWORD_RESET_LINK_GENERATED",
      targetType: "user",
      targetId: data.userId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { link: linkData.properties?.action_link ?? null };
  });
