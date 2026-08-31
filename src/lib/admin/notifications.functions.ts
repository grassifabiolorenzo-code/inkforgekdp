import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";

export const listAdminNotifications = createServerFn({ method: "GET" })
  .middleware([requirePermission("system", "read")])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);

    const notifications = (data ?? []).map((n) => ({
      ...n,
      isRead: n.read_by.includes(context.userId),
    }));
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return { notifications, unreadCount };
  });

const markReadInput = z.object({ id: z.string().uuid() });

export const markAdminNotificationRead = createServerFn({ method: "POST" })
  .middleware([requirePermission("system", "read")])
  .inputValidator((data: unknown) => markReadInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: fetchError } = await supabaseAdmin
      .from("admin_notifications")
      .select("read_by")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!row || row.read_by.includes(context.userId)) return { ok: true };

    const { error } = await supabaseAdmin
      .from("admin_notifications")
      .update({ read_by: [...row.read_by, context.userId] })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
