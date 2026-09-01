import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";

export const listEmailTemplates = createServerFn({ method: "GET" })
  .middleware([requirePermission("marketing", "read")])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const upsertInput = z.object({
  id: z.string().uuid().optional(),
  key: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  category: z.enum(["transactional", "promotional"]),
  locale: z.string().trim().min(2).max(10).default("it"),
  subject: z.string().trim().min(1).max(300),
  bodyHtml: z.string().trim().min(1),
  isActive: z.boolean().default(true),
});

/** Crea o modifica un modello (transazionale o promozionale). Nessun deploy richiesto. */
export const upsertEmailTemplate = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "write")])
  .inputValidator((data: unknown) => upsertInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const row = {
      key: data.key,
      name: data.name,
      category: data.category,
      locale: data.locale,
      subject: data.subject,
      body_html: data.bodyHtml,
      is_active: data.isActive,
    };

    const { error } = data.id
      ? await supabaseAdmin.from("email_templates").update(row).eq("id", data.id)
      : await supabaseAdmin.from("email_templates").insert(row);

    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: data.id ? "EMAIL_TEMPLATE_UPDATED" : "EMAIL_TEMPLATE_CREATED",
      targetType: "email_template",
      targetId: data.id ?? data.key,
      result: error ? "failure" : "success",
      metadata: { key: data.key, locale: data.locale },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const templateIdInput = z.object({ templateId: z.string().uuid(), isActive: z.boolean() });

export const toggleEmailTemplateActive = createServerFn({ method: "POST" })
  .middleware([requirePermission("marketing", "write")])
  .inputValidator((data: unknown) => templateIdInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { writeAuditLog } = await import("@/lib/admin/adminAudit.server");

    const { error } = await supabaseAdmin
      .from("email_templates")
      .update({ is_active: data.isActive })
      .eq("id", data.templateId);
    await writeAuditLog({
      adminId: context.userId,
      adminEmail: context.adminEmail,
      action: "EMAIL_TEMPLATE_TOGGLED",
      targetType: "email_template",
      targetId: data.templateId,
      result: error ? "failure" : "success",
      metadata: { isActive: data.isActive },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
