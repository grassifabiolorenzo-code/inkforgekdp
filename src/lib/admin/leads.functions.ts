import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";

const listInput = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.string().max(40).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listAdminLeads = createServerFn({ method: "GET" })
  .middleware([requirePermission("marketing", "read")])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const offset = (data.page - 1) * data.pageSize;

    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_leads", {
      ...(data.search ? { _search: data.search } : {}),
      ...(data.status ? { _status: data.status } : {}),
      _limit: data.pageSize,
      _offset: offset,
    });
    if (error) throw new Error(error.message);

    const totalCount = rows?.[0]?.total_count ?? 0;
    return {
      leads: (rows ?? []).map(({ total_count: _totalCount, ...row }) => row),
      totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const leadIdInput = z.object({ leadId: z.string().uuid() });

export const resubscribeLead = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "write")])
  .inputValidator((data: unknown) => leadIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin
      .from("leads")
      .update({ status: "subscribed" })
      .eq("id", data.leadId);
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "LEAD_RESUBSCRIBED",
      targetType: "lead",
      targetId: data.leadId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unsubscribeLead = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "write")])
  .inputValidator((data: unknown) => leadIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin
      .from("leads")
      .update({ status: "unsubscribed" })
      .eq("id", data.leadId);
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "LEAD_UNSUBSCRIBED",
      targetType: "lead",
      targetId: data.leadId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cancellazione GDPR su richiesta esplicita del contatto. */
export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "delete")])
  .inputValidator((data: unknown) => leadIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin.from("leads").delete().eq("id", data.leadId);
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "LEAD_DELETED",
      targetType: "lead",
      targetId: data.leadId,
      result: error ? "failure" : "success",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
