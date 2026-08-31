import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requirePermission } from "@/lib/admin/adminMiddleware";

const searchInput = z.object({ query: z.string().trim().min(1).max(200) });

export const globalAdminSearch = createServerFn({ method: "GET" })
  .middleware([requirePermission("users", "read")])
  .inputValidator((data: unknown) => searchInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: result, error } = await supabaseAdmin.rpc("admin_global_search", {
      _query: data.query,
    });
    if (error) throw new Error(error.message);
    return result as {
      users: { id: string; email: string | null; name: string | null }[];
      subscriptions: { id: string; user_email: string | null; status: string }[];
      payments: { id: string; user_email: string | null; amount: number | null; status: string }[];
    };
  });
