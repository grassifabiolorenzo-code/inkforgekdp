import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";

const listSubsInput = z.object({
  search: z.string().trim().max(200).optional(),
  planSlug: z.string().max(40).optional(),
  status: z.string().max(40).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listAdminSubscriptions = createServerFn({ method: "GET" })
  .middleware([requirePermission("subscriptions", "read")])
  .inputValidator((data: unknown) => listSubsInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const offset = (data.page - 1) * data.pageSize;
    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_subscriptions", {
      ...(data.search ? { _search: data.search } : {}),
      ...(data.planSlug ? { _plan_slug: data.planSlug } : {}),
      ...(data.status ? { _status: data.status } : {}),
      _limit: data.pageSize,
      _offset: offset,
    });
    if (error) throw new Error(error.message);
    const totalCount = rows?.[0]?.total_count ?? 0;
    return {
      subscriptions: (rows ?? []).map(({ total_count: _totalCount, ...row }) => row),
      totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const listPaymentsInput = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.string().max(40).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listAdminPayments = createServerFn({ method: "GET" })
  .middleware([requirePermission("payments", "read")])
  .inputValidator((data: unknown) => listPaymentsInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const offset = (data.page - 1) * data.pageSize;
    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_payments", {
      ...(data.search ? { _search: data.search } : {}),
      ...(data.status ? { _status: data.status } : {}),
      ...(data.from ? { _from: data.from } : {}),
      ...(data.to ? { _to: data.to } : {}),
      _limit: data.pageSize,
      _offset: offset,
    });
    if (error) throw new Error(error.message);
    const totalCount = rows?.[0]?.total_count ?? 0;
    return {
      payments: (rows ?? []).map(({ total_count: _totalCount, ...row }) => row),
      totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const exportPaymentsInput = z.object({
  status: z.string().max(40).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

const CSV_EXPORT_ROW_CAP = 10000;

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(",")).join("\n");
  return `${header}\n${body}`;
}

/** Export CSV pagamenti, con un tetto di sicurezza per non caricare milioni di righe in un colpo solo. */
export const exportAdminPayments = createServerFn({ method: "POST" })
  .middleware([requirePermission("payments", "read")])
  .inputValidator((data: unknown) => exportPaymentsInput.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_payments", {
      ...(data.status ? { _status: data.status } : {}),
      ...(data.from ? { _from: data.from } : {}),
      ...(data.to ? { _to: data.to } : {}),
      _limit: CSV_EXPORT_ROW_CAP,
      _offset: 0,
    });
    if (error) throw new Error(error.message);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "PAYMENTS_EXPORTED",
      metadata: { rows: rows?.length ?? 0, filters: data },
    });

    const csv = toCsv((rows ?? []) as Record<string, unknown>[], [
      "id",
      "created_at",
      "user_email",
      "amount",
      "currency",
      "status",
      "provider",
      "provider_payment_id",
      "plan_slug",
      "description",
    ]);
    return { csv, truncated: (rows?.length ?? 0) >= CSV_EXPORT_ROW_CAP };
  });

export const listAdminPlans = createServerFn({ method: "GET" })
  .middleware([requirePermission("plans", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("plans").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data;
  });

const updatePlanInput = z.object({
  planId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  price: z.number().min(0).max(9999).optional(),
  monthlyLimit: z.number().int().min(0).nullable().optional(),
  unlimited: z.boolean().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

/**
 * Il prezzo reale addebitato è quello configurato sulla variant Lemon Squeezy: modificare `price`
 * qui aggiorna solo il valore mostrato/registrato nel nostro DB, NON quanto Lemon Squeezy
 * effettivamente addebita. Per questo la modifica del prezzo è riservata al SUPER_ADMIN, con
 * audit log dedicato — chi la usa deve sapere che va sincronizzata a mano anche su Lemon Squeezy.
 */
export const updateAdminPlan = createServerFn({ method: "POST" })
  .middleware([requirePermission("plans", "write")])
  .inputValidator((data: unknown) => updatePlanInput.parse(data))
  .handler(async ({ data, context }) => {
    if (data.price !== undefined && context.adminRole !== "super_admin") {
      throw new Error("FORBIDDEN: solo il Super Admin può modificare il prezzo di un piano");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const patch: Record<string, unknown> = {};
    if (data.name !== undefined) patch["name"] = data.name;
    if (data.price !== undefined) patch["price"] = data.price;
    if (data.monthlyLimit !== undefined) patch["monthly_limit"] = data.monthlyLimit;
    if (data.unlimited !== undefined) patch["unlimited"] = data.unlimited;
    if (data.active !== undefined) patch["active"] = data.active;
    if (data.sortOrder !== undefined) patch["sort_order"] = data.sortOrder;

    const { error } = await supabaseAdmin
      .from("plans")
      .update(patch as never)
      .eq("id", data.planId);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "PLAN_SETTINGS_CHANGED",
      targetType: "plan",
      targetId: data.planId,
      result: error ? "failure" : "success",
      metadata: patch,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
