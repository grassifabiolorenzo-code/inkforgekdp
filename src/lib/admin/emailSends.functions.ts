import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";

const listInput = z.object({
  recipientUserId: z.string().uuid().optional(),
  recipientEmail: z.string().max(255).optional(),
  campaignId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

/** Corrispondenza inviata: filtrabile per utente (storico su admin.users.$id) o per campagna. */
export const listEmailSends = createServerFn({ method: "GET" })
  .middleware([requirePermission("marketing", "read")])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const offset = (data.page - 1) * data.pageSize;

    const { data: rows, error } = await supabaseAdmin.rpc("admin_list_email_sends", {
      ...(data.recipientUserId ? { _recipient_user_id: data.recipientUserId } : {}),
      ...(data.recipientEmail ? { _recipient_email: data.recipientEmail } : {}),
      ...(data.campaignId ? { _campaign_id: data.campaignId } : {}),
      _limit: data.pageSize,
      _offset: offset,
    });
    if (error) throw new Error(error.message);

    const totalCount = rows?.[0]?.total_count ?? 0;
    return {
      sends: (rows ?? []).map(({ total_count: _totalCount, ...row }) => row),
      totalCount,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

export const getEmailKpis = createServerFn({ method: "GET" })
  .middleware([requirePermission("marketing", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("admin_email_kpis");
    if (error) throw new Error(error.message);
    return data as {
      total_leads: number;
      subscribed_leads: number;
      unsubscribed_leads: number;
      converted_leads: number;
      campaigns_sent: number;
      emails_sent_last_30d: number;
      emails_queued_no_provider: number;
    };
  });

const sendManualInput = z.object({
  userId: z.string().uuid(),
  subject: z.string().trim().min(1).max(300),
  html: z.string().trim().min(1),
});

/** Corrispondenza 1:1 dall'admin verso un abbonato specifico (sezione "Corrispondenza email" su admin.users.$id). */
export const sendManualEmailToUser = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "write")])
  .inputValidator((data: unknown) => sendManualInput.parse(data))
  .handler(async ({ data, context }) => {
    const { sendManualEmail } = await import("@/lib/email/send.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    let result: { status: string } | null = null;
    let sendError: Error | null = null;
    try {
      result = await sendManualEmail({
        recipientUserId: data.userId,
        subject: data.subject,
        html: data.html,
        sentByAdminId: context.userId,
      });
    } catch (error) {
      sendError = error instanceof Error ? error : new Error(String(error));
    }

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "MANUAL_EMAIL_SENT",
      targetType: "user",
      targetId: data.userId,
      result: sendError ? "failure" : "success",
      metadata: { subject: data.subject, status: result?.status ?? null },
    });
    if (sendError) throw sendError;
    return result;
  });
